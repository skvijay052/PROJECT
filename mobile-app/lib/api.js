import { getSupabaseClient } from './supabase';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const lanApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL_LAN?.trim();

function resolveApiBaseUrl() {
  if (!apiBaseUrl && lanApiBaseUrl) {
    return lanApiBaseUrl;
  }

  if (
    apiBaseUrl &&
    lanApiBaseUrl &&
    (apiBaseUrl.includes('10.0.2.2') ||
      apiBaseUrl.includes('127.0.0.1') ||
      apiBaseUrl.includes('localhost'))
  ) {
    return lanApiBaseUrl;
  }

  return apiBaseUrl;
}

const resolvedApiBaseUrl = resolveApiBaseUrl();
const MAX_API_LIST_LIMIT = 50;

export const isApiConfigured = Boolean(resolvedApiBaseUrl);

function getApiBaseUrl() {
  if (!isApiConfigured) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL_LAN in mobile-app/.env');
  }

  return resolvedApiBaseUrl;
}

async function getAccessToken() {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw error;
  }

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    throw new Error('No active Supabase session found.');
  }

  return accessToken;
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const accessToken = await getAccessToken();
  const url = `${getApiBaseUrl()}${path}`;
  let response;
  const isFormData = Boolean(options.formData);

  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? options.body
            : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new Error(
      `Could not reach backend at ${url}. Check that FastAPI is running and your API base URL matches your emulator or device.`
    );
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    const detail = payload?.detail;
    const error = new Error(
      typeof detail === 'string' ? detail : `API request failed with status ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function appendLimit(params, limit) {
  if (limit === undefined || limit === null) {
    return;
  }

  const numericLimit = Number(limit);
  if (!Number.isFinite(numericLimit)) {
    return;
  }

  const normalizedLimit = Math.max(1, Math.min(MAX_API_LIST_LIMIT, Math.trunc(numericLimit)));
  params.set('limit', String(normalizedLimit));
}

export async function getMyProfile() {
  return apiRequest('/profiles/me');
}

export async function getMyProfileStats() {
  return apiRequest('/profiles/me/stats');
}

export async function getProfileById(profileId) {
  return apiRequest(`/profiles/${profileId}`);
}

export async function upsertMyProfile(profilePatch = {}) {
  return apiRequest('/profiles/me', {
    method: 'PUT',
    body: profilePatch,
  });
}

export async function updateMyPreferences(preferencesPatch = {}) {
  return apiRequest('/profiles/preferences', {
    method: 'PUT',
    body: preferencesPatch,
  });
}

export async function getDiscoverProfiles(options = {}) {
  const params = new URLSearchParams();
  if (options.onlyOnline) {
    params.set('only_online', 'true');
  }
  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/profiles/discover${query ? `?${query}` : ''}`);
}

export async function searchProfiles(options = {}) {
  const params = new URLSearchParams();

  if (options.ageMin !== undefined && options.ageMin !== null && options.ageMin !== '') {
    params.set('age_min', String(options.ageMin));
  }
  if (options.ageMax !== undefined && options.ageMax !== null && options.ageMax !== '') {
    params.set('age_max', String(options.ageMax));
  }
  if (options.country?.trim()) {
    params.set('country', options.country.trim());
  }
  if (options.state?.trim()) {
    params.set('state', options.state.trim());
  }
  if (options.religion?.trim()) {
    params.set('religion', options.religion.trim());
  }
  if (options.caste?.trim()) {
    params.set('caste', options.caste.trim());
  }
  if (options.city?.trim()) {
    params.set('city', options.city.trim());
  }
  if (options.district?.trim()) {
    params.set('district', options.district.trim());
  }
  if (options.education?.trim()) {
    params.set('education', options.education.trim());
  }
  if (options.profession?.trim()) {
    params.set('profession', options.profession.trim());
  }
  if (options.onlyOnline) {
    params.set('only_online', 'true');
  }

  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/profiles/search${query ? `?${query}` : ''}`);
}

export async function sendInterest(receiverId) {
  return apiRequest('/interests', {
    method: 'POST',
    body: {
      receiver_id: receiverId,
    },
  });
}

export async function getReceivedInterests(options = {}) {
  const params = new URLSearchParams();
  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/interests/received${query ? `?${query}` : ''}`);
}

export async function getSentInterests(options = {}) {
  const params = new URLSearchParams();
  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/interests/sent${query ? `?${query}` : ''}`);
}

export async function updateInterestStatus(interestId, status) {
  return apiRequest(`/interests/${interestId}`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function getMatches(options = {}) {
  const params = new URLSearchParams();
  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/matches${query ? `?${query}` : ''}`);
}

export async function getChats(options = {}) {
  const params = new URLSearchParams();
  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/chats${query ? `?${query}` : ''}`);
}

export async function getChatMessages(profileId) {
  return apiRequest(`/chats/${profileId}/messages`);
}

export async function sendChatMessage(profileId, text) {
  return apiRequest(`/chats/${profileId}/messages`, {
    method: 'POST',
    body: { text },
  });
}

export async function getMyShortlists(options = {}) {
  const params = new URLSearchParams();
  appendLimit(params, options.limit);

  const query = params.toString();
  return apiRequest(`/shortlists/me${query ? `?${query}` : ''}`);
}

export async function addToShortlist(profileId) {
  return apiRequest('/shortlists', {
    method: 'POST',
    body: { target_profile_id: profileId },
  });
}

export async function removeFromShortlist(profileId) {
  return apiRequest(`/shortlists/${profileId}`, {
    method: 'DELETE',
  });
}

export async function getMyPhotos() {
  return apiRequest('/profiles/me/photos');
}

export async function getProfilePhotos(profileId) {
  return apiRequest(`/profiles/${profileId}/photos`);
}

export async function uploadMyPhoto(asset) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `profile-photo-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  });

  return apiRequest('/profiles/me/photos', {
    method: 'POST',
    body: formData,
    formData: true,
  });
}

export async function setMyPrimaryPhoto(photoId) {
  return apiRequest(`/profiles/me/photos/${photoId}/primary`, {
    method: 'PATCH',
  });
}

export async function deleteMyPhoto(photoId) {
  return apiRequest(`/profiles/me/photos/${photoId}`, {
    method: 'DELETE',
  });
}

export async function syncAuthenticatedProfile(profilePatch = {}) {
  return upsertMyProfile(profilePatch);
}
