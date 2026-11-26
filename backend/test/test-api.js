import http from 'http';
import { requireAuth } from '../src/middleware/requireAuth.js';
import { estimateOsmBudget, getTripBudgetContext } from '../src/services/budgetService.js';
import { getMockPlacesForLocation } from '../src/mock/destinationsData.js';
import { isUsablePhotonName } from '../src/services/placesService.js';
import { buildManualItinerary } from '../src/services/manualItineraryService.js';
import {
  heuristicParseIntent,
  mergeConversationIntent,
  parseUserIntent,
  parseGeminiIntentResponse,
} from '../src/services/geminiService.js';
import {
  geminiChatResponseSchema,
  geminiIntentResponseSchema,
} from '../src/schemas/intentSchema.js';

const BASE_URL = `${process.env.TEST_BASE_URL || 'http://localhost:5000'}/api`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Kelana API Verification Tests...\n');

  try {
    if (
      geminiChatResponseSchema.required.length !== 1 ||
      geminiChatResponseSchema.required[0] !== 'chat_response' ||
      !geminiIntentResponseSchema.properties.location ||
      !geminiIntentResponseSchema.properties.budget
    ) {
      throw new Error('Gemini intent response schemas are invalid');
    }

    const plainTextResponse = 'Hai, mau pergi ke mana?';
    const chatFallback = parseGeminiIntentResponse(plainTextResponse);
    if (
      chatFallback.chat_response !== plainTextResponse ||
      chatFallback.destination !== null ||
      chatFallback.budget !== 0
    ) {
      throw new Error('Plain-text Gemini response fallback failed');
    }

    const fencedResponse = parseGeminiIntentResponse('```json\n{"location":"Bali"}\n```');
    if (fencedResponse.location !== 'Bali') {
      throw new Error('Fenced Gemini JSON parsing failed');
    }

    const originalMockMode = process.env.MOCK_MODE;
    const originalGeminiApiKey = process.env.GEMINI_API_KEY;
    process.env.MOCK_MODE = 'always';
    process.env.GEMINI_API_KEY = '';
    try {
      let rejectedWithoutGemini = false;
      try {
        await parseUserIntent('halo');
      } catch (error) {
        rejectedWithoutGemini = error.message.includes('Gemini is required');
      }
      if (!rejectedWithoutGemini) {
        throw new Error('Chat response did not require the Gemini API');
      }
    } finally {
      if (originalMockMode === undefined) {
        delete process.env.MOCK_MODE;
      } else {
        process.env.MOCK_MODE = originalMockMode;
      }
      if (originalGeminiApiKey === undefined) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = originalGeminiApiKey;
      }
    }

    const fallbackIntent = heuristicParseIntent(
      'Mau ke Taipei tanggal 20 Oktober 2026 selama 5 hari, budget Rp 20 juta, suka pantai dan kuliner',
    );
    const dottedBudgetIntent = heuristicParseIntent('Budget Rp 5.000.000');
    const commaBudgetIntent = heuristicParseIntent('Budget Rp 5,000,000');
    const dateYearIntent = heuristicParseIntent('Mau ke Bali tanggal 20 Oktober 2026');
    const incompleteIntent = heuristicParseIntent('Mau liburan dengan budget 500 ribu');
    const greetingIntent = heuristicParseIntent('Halo');
    const unspecifiedIntent = heuristicParseIntent('Mau liburan ke Bandung');
    const vagueDestinationIntent = heuristicParseIntent('Mau liburan ke luar negeri');
    const priorChat = [
      { role: 'user', parts: [{ text: 'halo' }] },
      { role: 'model', parts: [{ text: 'Hai! Mau ke kota mana?' }] },
      { role: 'user', parts: [{ text: 'budget 100 juta' }] },
      { role: 'model', parts: [{ text: 'Budget tercatat. Mau ke kota mana?' }] },
    ];
    const budgetFromHistory = mergeConversationIntent('Jakarta', priorChat);
    if (
      fallbackIntent.location !== 'Taipei' ||
      !fallbackIntent.dateTime.includes('20 Oktober 2026') ||
      !fallbackIntent.dateTime.includes('5 hari') ||
      fallbackIntent.budget !== 20000000 ||
      incompleteIntent.location !== '' ||
      incompleteIntent.budget !== 500000 ||
      incompleteIntent.categories.length !== 0 ||
      greetingIntent.location !== '' ||
      greetingIntent.budget !== 0 ||
      greetingIntent.categories.length !== 0 ||
      !greetingIntent.userNotes.includes('kota atau destinasi') ||
      unspecifiedIntent.location !== 'Bandung' ||
      unspecifiedIntent.budget !== 0 ||
      unspecifiedIntent.budgetLevel !== 'unspecified' ||
      unspecifiedIntent.categories.length !== 0 ||
      vagueDestinationIntent.location !== '' ||
      vagueDestinationIntent.budget !== 0 ||
      budgetFromHistory.location !== 'Jakarta' ||
      budgetFromHistory.budget !== 100000000 ||
      !budgetFromHistory.chat_response.includes('100.000.000') ||
      dottedBudgetIntent.budget !== 5000000 ||
      commaBudgetIntent.budget !== 5000000 ||
      dateYearIntent.budget !== 0 ||
      getMockPlacesForLocation('Singapore').length !== 0 ||
      incompleteIntent.dateTime !== 'Belum ditentukan'
    ) {
      throw new Error('Intent fallback extraction failed');
    }

    const routeCalculator = async places => ({
      travelLegs: places.slice(1).map((place, index) => ({
        fromPlaceId: places[index].placeId,
        toPlaceId: place.placeId,
        durationMinutes: 8,
      })),
      totalEstimatedTravelMinutes: Math.max(0, places.length - 1) * 8,
      polylinePoints: places.map(place => ({ lat: place.lat, lng: place.lng })),
    });
    const manualItinerary = await buildManualItinerary([
      {
        placeId: 'cafe-one',
        name: 'Cafe One',
        category: 'cafe',
        lat: -6.9,
        lng: 110.4,
        openingHours: '10:30 - 12:00 WIB',
        estimatedCostMin: 40000,
        estimatedCostMax: 50000,
        budgetCategory: 'food',
        suggestedDurationMinutes: 45,
      },
      {
        placeId: 'cafe-two',
        name: 'Cafe Two',
        category: 'cafe',
        lat: -6.901,
        lng: 110.401,
        openingHours: '08:00 - 20:00 WIB',
        estimatedCostMin: 60000,
        estimatedCostMax: 80000,
        budgetCategory: 'food',
        suggestedDurationMinutes: 45,
      },
      {
        placeId: 'museum',
        name: 'City Museum',
        category: 'museum',
        lat: -6.902,
        lng: 110.402,
        estimatedCostMin: 0,
        estimatedCostMax: 10000,
        budgetCategory: 'other',
      },
      {
        placeId: 'expensive-cafe',
        name: 'Expensive Cafe',
        category: 'cafe',
        lat: -6.903,
        lng: 110.403,
        estimatedCostMin: 250000,
        estimatedCostMax: 300000,
        budgetCategory: 'food',
      },
    ], {
      location: 'Semarang',
      categories: ['Kuliner'],
      budget: 200000,
      foodBudgetPercent: 100,
      accommodationBudgetPercent: 0,
      dateTime: '10:00-13:00',
    }, { calculateRoute: routeCalculator });
    const scheduledStops = manualItinerary.places;
    const clockMinutes = value => {
      const match = String(value || '').match(/(\d{2}):(\d{2})/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
    };
    const firstArrival = clockMinutes(scheduledStops[0]?.suggestedArrivalTime);
    const secondArrival = clockMinutes(scheduledStops[1]?.suggestedArrivalTime);
    if (
      scheduledStops.length !== 2 ||
      scheduledStops[0].placeId !== 'cafe-one' ||
      scheduledStops[1].placeId !== 'cafe-two' ||
      firstArrival < 10 * 60 + 30 ||
      firstArrival + scheduledStops[0].suggestedDurationMinutes > secondArrival ||
      secondArrival + scheduledStops[1].suggestedDurationMinutes > 13 * 60 ||
      manualItinerary.totalEstimatedTravelMinutes !== 8 ||
      scheduledStops.some(place => place.placeId === 'museum' || place.placeId === 'expensive-cafe')
    ) {
      throw new Error('Manual itinerary schedule, category, or budget constraints failed');
    }

    const complexOpeningHours = await buildManualItinerary([{
      placeId: 'weekday-hours',
      name: 'Weekday Schedule Place',
      category: 'attraction',
      lat: -6.9,
      lng: 110.4,
      openingHours: 'Mo-Fr 20:00-21:00',
      estimatedCostMin: 0,
      estimatedCostMax: 0,
    }], {
      location: 'Semarang',
      categories: [],
      budget: 0,
      dateTime: '09:00-12:00',
    }, { calculateRoute: routeCalculator });
    if (
      !complexOpeningHours.places[0]?.suggestedArrivalTime.includes('09:00 WIB')
    ) {
      throw new Error('Complex day-specific opening hours must not be treated as daily hours');
    }

    const scheduleAfterImpossiblePlace = await buildManualItinerary([
      {
        placeId: 'closed-during-trip',
        name: 'Closed During Trip',
        category: 'attraction',
        lat: -6.9,
        lng: 110.4,
        openingHours: '20:00-21:00',
        estimatedCostMin: 0,
        estimatedCostMax: 0,
      },
      {
        placeId: 'available-place',
        name: 'Available Place',
        category: 'attraction',
        lat: -6.901,
        lng: 110.401,
        estimatedCostMin: 0,
        estimatedCostMax: 0,
      },
    ], {
      location: 'Semarang',
      categories: [],
      budget: 0,
      dateTime: '09:00-12:00',
    }, { calculateRoute: routeCalculator });
    if (
      scheduleAfterImpossiblePlace.places.length !== 1 ||
      scheduleAfterImpossiblePlace.places[0].placeId !== 'available-place'
    ) {
      throw new Error('An impossible opening-hours slot must not prevent later places from scheduling');
    }

    if (
      isUsablePhotonName('C 2301') ||
      isUsablePhotonName('C 19271') ||
      !isUsablePhotonName('Tahu Gimbal Mas Rendra') ||
      !isUsablePhotonName('7-Eleven') ||
      [
        'SCAMERS here!',
        'Free entrance',
        'Tourist entrance',
        'Fishfarm',
        'Shadehouse',
        'Place 200k',
      ].some(name => isUsablePhotonName(name))
    ) {
      throw new Error('Photon place-name quality filtering failed');
    }

    const budgetMeal = estimateOsmBudget(
      { osm_key: 'amenity', osm_value: 'fast_food' },
      2,
    );
    const luxuryMeal = estimateOsmBudget(
      { osm_key: 'amenity', osm_value: 'restaurant', extra: { cuisine: 'fine_dining' } },
      2,
    );
    const luxuryStay = estimateOsmBudget(
      { osm_key: 'tourism', osm_value: 'hotel', extra: { stars: '4' } },
      2,
      3,
    );
    const allocationContext = getTripBudgetContext({
      budget: 100000,
      foodBudgetPercent: 80,
      accommodationBudgetPercent: 50,
    });
    if (
      budgetMeal.budgetTier !== 'budget' ||
      budgetMeal.estimatedCostMax !== 90000 ||
      luxuryMeal.budgetTier !== 'luxury' ||
      luxuryMeal.estimatedCostMax !== 800000 ||
      luxuryStay.budgetTier !== 'luxury' ||
      luxuryStay.estimatedCostMax !== 7000000 ||
      allocationContext.foodBudgetPercent + allocationContext.accommodationBudgetPercent > 100
    ) {
      throw new Error('OSM budget archetype estimation failed');
    }

    // 1. Health check
    console.log('1️⃣ Testing GET /api/health ...');
    const health = await request('GET', '/health');
    console.log('   Status:', health.status);
    console.log('   App:', health.body?.app);
    console.log('   API Status:', JSON.stringify(health.body?.apiStatus));
    if (health.status !== 200) throw new Error('Health check failed');

    console.log('\n1️⃣ Testing protected endpoints reject unauthenticated requests ...');
    const originalNodeEnv = process.env.NODE_ENV;
    const originalVercel = process.env.VERCEL;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    let rejectedStatus;
    try {
      await requireAuth(
        { headers: {} },
        {
          status(status) {
            rejectedStatus = status;
            return this;
          },
          json() {
            return this;
          },
        },
        () => {
          throw new Error('Protected middleware unexpectedly called next()');
        },
      );
    } finally {
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
      if (originalVercel === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = originalVercel;
      }
    }
    if (rejectedStatus !== 401) {
      throw new Error('Protected endpoint accepted an unauthenticated request');
    }

    // 2. Parse Intent
    console.log('\n2️⃣ Testing POST /api/parse-intent ...');
    const prompt = "hari ini mau ke Semarang, budget 100rb, suka tempat kuliner dan sejarah";
    console.log(`   Prompt: "${prompt}"`);
    const parseRes = await request('POST', '/parse-intent', { query: prompt });
    console.log('   Status:', parseRes.status);
    console.log('   Extracted Intent:', JSON.stringify(parseRes.body?.data, null, 2));
    if (parseRes.status !== 200 || !parseRes.body?.data?.location) {
      throw new Error('Intent parsing failed');
    }
    const intent = parseRes.body.data;

    // 3. Search Places
    console.log('\n3️⃣ Testing POST /api/search-places ...');
    const placesRes = await request('POST', '/search-places', intent);
    console.log('   Status:', placesRes.status);
    console.log(`   Found ${placesRes.body?.data?.length || 0} places.`);
    if (placesRes.body?.data?.length > 0) {
      console.log('   Sample place:', placesRes.body.data[0].name, `(${placesRes.body.data[0].category})`);
    }
    if (placesRes.status !== 200 || !placesRes.body?.data || placesRes.body.data.length === 0) {
      throw new Error('Search places failed');
    }
    if (placesRes.body.data.some(place => !isUsablePhotonName(place.name))) {
      throw new Error('Search places returned an ambiguous or identifier-like name');
    }

    const baliPlacesRes = await request('POST', '/search-places', {
      location: 'Bali',
      categories: [],
      budget: 0,
    });
    const baliPlaces = baliPlacesRes.body?.data || [];
    if (
      baliPlacesRes.status !== 200 ||
      baliPlaces.length === 0 ||
      baliPlaces.some(place =>
        !place.photoUrl ||
        !/^https:\/\/(?:[^/]+\.)?wikimedia\.org\//i.test(place.photoUrl) ||
        !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(place.photoUrl)
      ) ||
      baliPlaces.some(place => /scamers here!/i.test(place.name))
    ) {
      throw new Error('Bali place search returned missing or invalid Wikimedia photos');
    }

    const missingLocationRes = await request('POST', '/search-places', { categories: ['Kuliner'] });
    if (missingLocationRes.status !== 400) {
      throw new Error('Place search silently accepted a missing destination');
    }
    const places = placesRes.body.data.slice(0, 4);

    // 4. Build Itinerary
    console.log('\n4️⃣ Testing POST /api/build-itinerary ...');
    const buildRes = await request('POST', '/build-itinerary', { places, intent });
    console.log('   Status:', buildRes.status);
    console.log('   Trip Title:', buildRes.body?.data?.title);
    console.log('   Total Travel Time:', buildRes.body?.data?.totalEstimatedTravelMinutes, 'minutes');
    console.log('   Stops Count:', buildRes.body?.data?.places?.length);
    if (buildRes.body?.data?.places) {
      buildRes.body.data.places.forEach((p, idx) => {
        console.log(`     [Stop ${idx + 1}] ${p.name} | Tiba: ${p.suggestedArrivalTime} (${p.suggestedDurationMinutes} mnt) | Jarak/waktu dari prev: ${p.estimatedTravelTimeFromPrevious || 0} mnt`);
      });
    }
    if (buildRes.status !== 200 || !buildRes.body?.data?.places) {
      throw new Error('Build itinerary failed');
    }
    const itineraryPlaceCost = buildRes.body.data.places.reduce(
      (total, place) => total + (place.estimatedPrice || 0),
      0,
    );
    const itineraryFoodCost = buildRes.body.data.places
      .filter(place => place.budgetCategory === 'food')
      .reduce((total, place) => total + (place.estimatedPrice || 0), 0);
    const itineraryAccommodationCost = buildRes.body.data.places
      .filter(place => place.budgetCategory === 'accommodation')
      .reduce((total, place) => total + (place.estimatedPrice || 0), 0);
    const exceedsBudget = intent.budget > 0 && itineraryPlaceCost > intent.budget;
    const exceedsCategoryAllocation = intent.budget > 0 && (
      itineraryFoodCost > intent.budget * intent.foodBudgetPercent / 100 ||
      itineraryAccommodationCost > intent.budget * intent.accommodationBudgetPercent / 100
    );
    if (
      (exceedsBudget || exceedsCategoryAllocation) &&
      !buildRes.body.data.summary.toLowerCase().includes('melebihi budget')
    ) {
      throw new Error('Over-budget itinerary did not include a cost warning');
    }
    if (
      intent.categories.includes('Kuliner') &&
      !buildRes.body.data.places.some(place => place.budgetCategory === 'food')
    ) {
      throw new Error('Places in the culinary category were not assigned to the food budget');
    }
    console.log(`   Place-cost ceiling: Rp ${itineraryPlaceCost} / Rp ${intent.budget}`);

    const unaffordableRes = await request('POST', '/build-itinerary', {
      places: [1, 2, 3].map(index => ({
        placeId: `over-budget-place-${index}`,
        name: `Over Budget Place ${index}`,
        category: 'attraction',
        estimatedPrice: 50000,
        estimatedCostMin: 50000,
        estimatedCostMax: 50000,
        budgetCategory: 'other',
      })),
      intent: {
        location: 'Semarang',
        budget: 100000,
        peopleCount: 1,
        dateTime: 'Hari ini',
      },
    });
    const overBudgetPlaces = unaffordableRes.body?.data?.places || [];
    const overBudgetTotal = overBudgetPlaces.reduce(
      (total, place) => total + place.estimatedCostMax,
      0,
    );
    if (
      unaffordableRes.status !== 200 ||
      overBudgetPlaces.length !== 3 ||
      overBudgetTotal !== 150000 ||
      !unaffordableRes.body.data.summary.toLowerCase().includes('melebihi budget') ||
      !unaffordableRes.body.data.summary.toLowerCase().includes('koordinat tidak lengkap')
    ) {
      throw new Error('Over-budget itinerary must retain all places and return a clear warning');
    }

    console.log('\n5️⃣ Testing itinerary persistence and sharing ...');
    const savedRes = await request('POST', '/itineraries', {
      ...buildRes.body.data,
      shareCode: 'KLN-000001',
    });
    if (
      savedRes.status !== 200 ||
      !savedRes.body?.data?.shareCode ||
      savedRes.body.data.shareCode === 'KLN-000001'
    ) {
      throw new Error('Saving an itinerary failed');
    }
    const updatedRes = await request('POST', '/itineraries', {
      ...savedRes.body.data,
      shareCode: 'KLN-000002',
    });
    if (updatedRes.body?.data?.shareCode !== savedRes.body.data.shareCode) {
      throw new Error('Updating an itinerary changed its share code');
    }
    const savedList = await request('GET', '/itineraries');
    if (!savedList.body?.data?.some((item) => item.id === savedRes.body.data.id)) {
      throw new Error('Saved itinerary was not returned in the list');
    }
    const sharedRes = await request('GET', `/share/${savedRes.body.data.shareCode}`);
    if (sharedRes.status !== 200 || sharedRes.body?.data?.id !== savedRes.body.data.id) {
      throw new Error('Shared itinerary could not be retrieved');
    }
    const deletedRes = await request('DELETE', `/itineraries/${savedRes.body.data.id}`);
    if (deletedRes.status !== 200 || deletedRes.body?.success !== true) {
      throw new Error('Deleting an itinerary failed');
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! ✅');
  } catch (err) {
    console.error('\n❌ Test execution failed:', err.message);
    process.exit(1);
  }
}

runTests();
