import axios from 'axios';
import { config } from '../config/env.js';
import { estimateOsmBudget, getTripBudgetContext } from './budgetService.js';
import { getMockPlacesForLocation } from '../mock/destinationsData.js';

const PHOTON_URL = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIMEDIA_IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp)$/i;
const UNWANTED_PLACE_NAME = /\b(?:scam(?:mer|er)?s?|free|entrance|fish\s?farm|shade\s?house)\b|!/i;
const UNWANTED_PHOTO_CONTENT = /\b(?:logo|map|peta|diagram|coat of arms|flag|icon|symbol|poster|screenshot|illustration|drawing|ai[- ]generated|synthetic|collage)\b/i;
const PRICE_LIKE_PLACE_NAME = /\b\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta)\b/i;

export function isUsablePhotonName(value) {
  const name = String(value || '').trim();
  const letters = name.match(/\p{L}/gu)?.length || 0;
  const digits = name.match(/\p{N}/gu)?.length || 0;
  const alphanumericCount = letters + digits;

  if (
    name.length < 3 ||
    name.length > 100 ||
    letters < 3 ||
    alphanumericCount === 0 ||
    letters / alphanumericCount < 0.5 ||
    /^(?:unknown|unnamed|no name|unclassified|object|node|way)\b/i.test(name) ||
    UNWANTED_PLACE_NAME.test(name) ||
    PRICE_LIKE_PLACE_NAME.test(name)
  ) {
    return false;
  }

  return true;
}

function isValidWikimediaPhotoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      /(?:^|\.)wikimedia\.org$/i.test(url.hostname) &&
      WIKIMEDIA_IMAGE_EXTENSIONS.test(url.pathname);
  } catch {
    return false;
  }
}

function isUsableWikimediaImage(page, image) {
  if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mime)) {
    return false;
  }

  const width = Number(image.width);
  const height = Number(image.height);
  const thumbnailWidth = Number(image.thumbwidth);
  const thumbnailHeight = Number(image.thumbheight);
  const aspectRatio = width / height;
  const description = [
    page.title,
    image.extmetadata?.ObjectName?.value,
    image.extmetadata?.ImageDescription?.value,
  ].filter(Boolean).join(' ').replace(/<[^>]*>/g, ' ');

  return isValidWikimediaPhotoUrl(image.thumburl) &&
    width >= 400 &&
    height >= 400 &&
    thumbnailWidth >= 400 &&
    thumbnailHeight >= 300 &&
    aspectRatio >= 0.55 &&
    aspectRatio <= 2.2 &&
    !UNWANTED_PHOTO_CONTENT.test(description);
}

async function findWikimediaPhoto(searchQuery) {
  const response = await axios.get(WIKIMEDIA_API_URL, {
    params: {
      action: 'query',
      generator: 'search',
      gsrsearch: searchQuery,
      gsrnamespace: 6,
      gsrlimit: 8,
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: 800,
      format: 'json',
    },
    headers: { 'User-Agent': 'Kelana itinerary planner' },
    timeout: 2500,
  });
  const pages = Object.values(response.data.query?.pages || {})
    .sort((left, right) => left.index - right.index);
  const match = pages.find(page =>
    isUsableWikimediaImage(page, page.imageinfo?.[0]));

  return match?.imageinfo?.[0]?.thumburl || null;
}

export async function fetchRealPlacePhoto(placeName, location) {
  const primaryQuery = [placeName, location].filter(Boolean).join(' ').trim();
  const fallbackQuery = location
    ? `${location} tourism`
    : String(placeName || '').trim();

  for (const searchQuery of [...new Set([primaryQuery, fallbackQuery].filter(Boolean))]) {
    try {
      const photoUrl = await findWikimediaPhoto(searchQuery);
      if (photoUrl) return photoUrl;
    } catch (error) {
      console.warn(
        `[PlacesService] Wikimedia photo search failed for "${searchQuery}": ${error.message}`,
      );
    }
  }

  return null;
}

async function enrichPlacesWithPhotos(places, location) {
  const results = await Promise.allSettled(places.map(async place => {
    const photoUrl = isValidWikimediaPhotoUrl(place.photoUrl)
      ? place.photoUrl
      : await fetchRealPlacePhoto(place.name, location);

    return { ...place, photoUrl: photoUrl || '' };
  }));

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(
      `[PlacesService] Could not enrich photo for "${places[index].name}": ${result.reason}`,
    );
    return {
      ...places[index],
      photoUrl: isValidWikimediaPhotoUrl(places[index].photoUrl)
        ? places[index].photoUrl
        : '',
    };
  });
}

function osmTagsForCategories(categories, budgetLevel) {
  const tags = new Set();
  for (const category of categories) {
    const value = String(category).toLowerCase();
    if (/kuliner|food|restaurant|cafe/.test(value)) {
      if (budgetLevel === 'budget') {
        tags.add('amenity:fast_food');
        tags.add('amenity:food_court');
      } else if (budgetLevel === 'luxury') {
        tags.add('amenity:restaurant');
      } else {
        tags.add('amenity:cafe');
        tags.add('amenity:restaurant');
      }
    } else if (/akomodasi|penginapan|hotel|hostel|camping|stay/.test(value)) {
      if (budgetLevel === 'budget') {
        tags.add('tourism:hostel');
        tags.add('tourism:camp_site');
        tags.add('tourism:guest_house');
      } else if (budgetLevel === 'luxury') {
        tags.add('tourism:hotel');
      } else {
        tags.add('tourism:hotel');
        tags.add('tourism:motel');
        tags.add('tourism:apartment');
      }
    }
    else if (/sejarah|historic|history/.test(value)) tags.add('historic');
    else if (/alam|nature|outdoor/.test(value)) tags.add('leisure:park');
    else if (/belanja|shopping/.test(value)) tags.add('shop');
    else if (/religi|religious|worship/.test(value)) tags.add('amenity:place_of_worship');
    else if (/keluarga|family|hiburan|entertainment/.test(value)) tags.add('tourism:attraction');
    else tags.add('tourism:attraction');
  }
  return [...(tags.size ? tags : ['tourism:attraction'])].slice(0, 6);
}

export function transformPhotonFeature(feature, peopleCount = 1, durationDays = 1) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [longitude, latitude] = coordinates.map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const name = String(properties.name || '').trim();
  if (!isUsablePhotonName(name)) return null;
  const address = [
    [properties.housenumber, properties.street].filter(Boolean).join(' '),
    properties.city || properties.district,
    properties.state,
    properties.country,
  ].filter(Boolean).join(', ');
  const extra = properties.extra && typeof properties.extra === 'object'
    ? properties.extra
    : {};
  const cuisine = String(properties.cuisine || extra.cuisine || '');
  const stars = String(properties.stars || extra.stars || '');
  const fee = String(properties.fee || extra.fee || '');
  const budgetEstimate = estimateOsmBudget(properties, peopleCount, durationDays);
  const priceLevel = { free: 0, budget: 1, moderate: 2, luxury: 3 }[budgetEstimate.budgetTier];

  return {
    placeId: properties.osm_type && properties.osm_id
      ? `${properties.osm_type}:${properties.osm_id}`
      : `${latitude},${longitude}`,
    name,
    category: (properties.osm_value || properties.type || 'Destinasi Wisata').replace(/_/g, ' '),
    rating: 0,
    userRatingsTotal: 0,
    priceLevel,
    ...budgetEstimate,
    osmKey: properties.osm_key || '',
    osmValue: properties.osm_value || '',
    cuisine,
    stars,
    fee,
    lat: latitude,
    lng: longitude,
    address,
    photoUrl: '',
    description: address || 'Destinasi populer rekomendasi Kelana.',
    openingHours: properties.opening_hours || 'Buka setiap hari',
  };
}

/**
 * Search places by intent criteria (location, category, budget)
 */
export async function searchPlaces(intent = {}) {
  const location = String(intent.location || '').trim();
  if (!location) return [];
  const categories = intent.categories || [];
  const budget = intent.budget || 0;
  const { peopleCount, durationDays, budgetLevel } = getTripBudgetContext(intent);

  if (config.mockMode === 'always') {
    console.log(`[PlacesService] Using mock places dataset for: ${location}`);
    return enrichPlacesWithPhotos(
      getMockPlacesForLocation(location, categories, budget),
      location,
    );
  }

  try {
    const locationResponse = await axios.get(PHOTON_URL, {
      params: {
        q: location,
        limit: 1,
        lang: 'en',
      },
      headers: { 'User-Agent': 'Kelana itinerary planner' },
      timeout: 8000,
    });
    const coordinates = locationResponse.data.features?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      console.warn('[PlacesService] Photon could not geocode the requested location, falling back to mock data');
      return enrichPlacesWithPhotos(
        getMockPlacesForLocation(location, categories, budget),
        location,
      );
    }

    const [longitude, latitude] = coordinates.map(Number);
    const osmTags = osmTagsForCategories(categories, budgetLevel);
    const responses = await Promise.all(osmTags.map(osmTag => axios.get(PHOTON_REVERSE_URL, {
      params: { lon: longitude, lat: latitude, radius: 10, limit: 10, lang: 'en', osm_tag: osmTag },
      headers: { 'User-Agent': 'Kelana itinerary planner' },
      timeout: 8000,
    })));

    const transformed = [];
    const seenPlaceIds = new Set();
    for (let index = 0; index < 10 && transformed.length < 10; index++) {
      for (const response of responses) {
        if (transformed.length >= 10) break;
        const feature = response.data.features?.[index];
        if (!feature) continue;

        const place = transformPhotonFeature(feature, peopleCount, durationDays);
        if (place && !seenPlaceIds.has(place.placeId)) {
          seenPlaceIds.add(place.placeId);
          transformed.push(place);
        }
      }
    }

    if (transformed.length === 0) {
      console.warn('[PlacesService] Photon returned no usable places, falling back to mock data');
      return enrichPlacesWithPhotos(
        getMockPlacesForLocation(location, categories, budget),
        location,
      );
    }

    return enrichPlacesWithPhotos(transformed, location);
  } catch (error) {
    console.error('[PlacesService] Error calling Photon:', error.message);
    return enrichPlacesWithPhotos(
      getMockPlacesForLocation(location, categories, budget),
      location,
    );
  }
}
