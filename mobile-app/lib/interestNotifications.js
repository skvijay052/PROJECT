import AsyncStorage from '@react-native-async-storage/async-storage';

const READ_INTEREST_IDS_KEY = 'bandhanaa-read-interest-ids';

function normalizeIds(ids = []) {
  return [...new Set(ids.filter(Boolean))];
}

export async function getReadInterestIds() {
  try {
    const rawValue = await AsyncStorage.getItem(READ_INTEREST_IDS_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? normalizeIds(parsedValue) : [];
  } catch (error) {
    return [];
  }
}

export async function markInterestNotificationsRead(ids = []) {
  const nextIds = normalizeIds(ids);
  if (nextIds.length === 0) {
    return getReadInterestIds();
  }

  const existingIds = await getReadInterestIds();
  const mergedIds = normalizeIds([...existingIds, ...nextIds]);
  await AsyncStorage.setItem(READ_INTEREST_IDS_KEY, JSON.stringify(mergedIds));
  return mergedIds;
}

export function countUnreadInterestNotifications(interests = [], readIds = []) {
  const readSet = new Set(readIds);

  return interests.filter((interest) => {
    if (!interest?.id || readSet.has(interest.id)) {
      return false;
    }

    return interest.status === 'pending' || interest.status === 'matched';
  }).length;
}
