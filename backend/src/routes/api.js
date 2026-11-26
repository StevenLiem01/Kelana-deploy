import express from 'express';
import { randomBytes } from 'node:crypto';
import { parseUserIntent } from '../services/geminiService.js';
import { buildManualItinerary } from '../services/manualItineraryService.js';
import { searchPlaces } from '../services/placesService.js';
import { config, isGeminiAvailable, isDirectionsAvailable } from '../config/env.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deleteItinerary,
  findItineraryByShareCode,
  getItinerary,
  listItineraries,
  saveItinerary,
} from '../services/itineraryStore.js';

const router = express.Router();
const INTERNAL_ERROR_MESSAGE = 'Terjadi kesalahan internal server.';

function handleApiError(res, route, error) {
  console.error(`[API ${route}] Error:`, error);
  return res.status(500).json({
    success: false,
    error: INTERNAL_ERROR_MESSAGE,
  });
}

/**
 * Health check & environment status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Kelana Backend API Proxy',
    version: '1.0.0',
    mode: config.mockMode,
    apiStatus: {
      geminiConfigured: isGeminiAvailable(),
      placeSearchProvider: 'Photon',
      directionsConfigured: isDirectionsAvailable()
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. Parse user chat/query into structured travel intent
 * POST /api/parse-intent
 * Body: { query: string, preferences?: object }
 */
router.post('/parse-intent', requireAuth, async (req, res) => {
  try {
    const { query, preferences, history = [] } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Parameter "query" wajib diisi dengan teks permintaan perjalanan.'
      });
    }
    if (!Array.isArray(history) || history.length > 20 || history.some(message =>
      !message ||
      !['user', 'model'].includes(message.role) ||
      !Array.isArray(message.parts) ||
      message.parts.length !== 1 ||
      typeof message.parts[0]?.text !== 'string' ||
      message.parts[0].text.length > 2000,
    )) {
      return res.status(400).json({
        success: false,
        error: 'Riwayat percakapan tidak valid.',
      });
    }

    console.log('[API /parse-intent] Processing intent request');
    const parsedIntent = await parseUserIntent(
      query.trim(),
      preferences || {},
      history,
    );

    const destination = parsedIntent.location ?? parsedIntent.destination;
    if (
      typeof destination !== 'string' ||
      destination.trim().length === 0 ||
      destination.toLowerCase().includes('belum ditentukan')
    ) {
      return res.status(200).json({
        success: true,
        data: parsedIntent
      });
    }

    return res.json({
      success: true,
      data: parsedIntent
    });
  } catch (error) {
    return handleApiError(res, '/parse-intent', error);
  }
});

/**
 * 2. Search places matching intent criteria
 * POST /api/search-places
 * Body: { location: string, categories?: string[], budget?: number }
 */
router.post('/search-places', requireAuth, async (req, res) => {
  try {
    const intent = req.body || {};
    if (typeof intent.location !== 'string' || intent.location.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Destination is required before searching for places.',
      });
    }
    intent.location = intent.location.trim();

    console.log(`[API /search-places] Searching places for ${intent.location}`);
    const places = await searchPlaces(intent);

    return res.json({
      success: true,
      count: places.length,
      data: places
    });
  } catch (error) {
    return handleApiError(res, '/search-places', error);
  }
});

/**
 * 3. Build a scheduled itinerary from selected places
 * POST /api/build-itinerary
 * Body: { places: Place[], intent?: ParsedIntent }
 */
router.post('/build-itinerary', requireAuth, async (req, res) => {
  try {
    const { places, intent } = req.body;

    if (!places || !Array.isArray(places) || places.length === 0) {
      return res.status(400).json({
        error: 'Parameter "places" harus berupa array tempat (minimal 1 tempat).'
      });
    }
    if (!intent || typeof intent.location !== 'string' || !intent.location.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Kota atau destinasi diperlukan untuk menyusun itinerary.',
      });
    }

    console.log(`[API /build-itinerary] Building itinerary for ${places.length} places`);

    const manualItinerary = await buildManualItinerary(places, intent);
    if (manualItinerary.places.length === 0 && Number(intent.budget) > 0) {
      return res.status(422).json({
        success: false,
        error: manualItinerary.summary,
      });
    }

    const itineraryResult = {
      id: 'itinerary_' + Date.now(),
      title: manualItinerary.title,
      summary: manualItinerary.summary,
      rawQuery: intent.userNotes || '',
      location: intent.location,
      totalEstimatedTravelMinutes: manualItinerary.totalEstimatedTravelMinutes,
      travelLegs: manualItinerary.travelLegs,
      polylinePoints: manualItinerary.polylinePoints,
      places: manualItinerary.places,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    return res.json({
      success: true,
      data: itineraryResult
    });
  } catch (error) {
    return handleApiError(res, '/build-itinerary', error);
  }
});

/**
 * 4. CRUD Itineraries (Proxy / Local Store)
 */
router.get('/itineraries', requireAuth, async (req, res) => {
  try {
    const items = await listItineraries(req.user.uid);
    return res.json({ success: true, data: items });
  } catch (error) {
    return handleApiError(res, '/itineraries', error);
  }
});

router.post('/itineraries', requireAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, error: 'Data itinerary tidak valid.' });
    }

    const itinerary = { ...req.body };
    if (itinerary.id != null && !/^[A-Za-z0-9_-]{1,128}$/.test(String(itinerary.id))) {
      return res.status(400).json({ success: false, error: 'ID itinerary tidak valid.' });
    }
    itinerary.id ||= 'itin_' + Date.now();
    itinerary.userId = req.user.uid;
    itinerary.updatedAt = new Date().toISOString();
    const existingItinerary = await getItinerary(req.user.uid, itinerary.id);
    itinerary.shareCode = existingItinerary?.shareCode ??
      'KLN-' + randomBytes(6).toString('hex').toUpperCase();

    await saveItinerary(req.user.uid, itinerary);
    return res.json({ success: true, data: itinerary });
  } catch (error) {
    return handleApiError(res, '/itineraries', error);
  }
});

router.get('/itineraries/:id', requireAuth, async (req, res) => {
  try {
    const item = (await listItineraries(req.user.uid)).find(({ id }) => id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Itinerary tidak ditemukan.' });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    return handleApiError(res, '/itineraries/:id', error);
  }
});

router.delete('/itineraries/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteItinerary(req.user.uid, req.params.id);
    return res.json({ success: deleted });
  } catch (error) {
    return handleApiError(res, '/itineraries/:id', error);
  }
});

router.get('/share/:shareCode', async (req, res) => {
  try {
    const item = await findItineraryByShareCode(req.params.shareCode.toUpperCase());
    if (item) {
      return res.json({ success: true, data: item });
    }
    return res.status(404).json({ error: 'Kode share tidak valid atau sudah kadaluarsa.' });
  } catch (error) {
    return handleApiError(res, '/share/:shareCode', error);
  }
});

export default router;
