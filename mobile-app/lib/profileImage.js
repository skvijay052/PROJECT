const defaultProfilePhoto = require('../assets/default-profile-photo.png');

export { defaultProfilePhoto };

export function getProfileImageUri(image) {
  if (typeof image !== 'string') {
    return '';
  }

  return image.trim();
}

export function hasProfileImage(image) {
  return getProfileImageUri(image).length > 0;
}

export function getProfileImageSource(image) {
  const uri = getProfileImageUri(image);
  return uri ? { uri } : defaultProfilePhoto;
}
