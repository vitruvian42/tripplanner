import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};


import placeholderData from './placeholder-images.json';

export const placeholderImages = placeholderData.placeholderImages;

export const placeholderImageById: { [key: string]: typeof placeholderImages[0] } = {};
placeholderImages.forEach(image => {
  placeholderImageById[image.id] = image;
});

export const defaultPlaceholderImage = placeholderImageById['new-york']; // Fallback to a default image

/**
 * Selects a relevant placeholder image based on the destination.
 * Prioritizes exact matches, then partial matches, then falls back to a random image.
 */
export function getRelevantPlaceholderImage(destination: string) {
  const lowerCaseDestination = destination.toLowerCase();

  // 1. Try to find an exact match by ID
  const exactMatch = placeholderImages.find(image => image.id === lowerCaseDestination);
  if (exactMatch) {
    return exactMatch;
  }

  // 2. Try to find a partial match in description or hint
  const partialMatch = placeholderImages.find(image => 
    image.description.toLowerCase().includes(lowerCaseDestination) ||
    image.imageHint.toLowerCase().includes(lowerCaseDestination)
  );
  if (partialMatch) {
    return partialMatch;
  }

  // 3. Fallback to a random image if no match found
  const randomIndex = Math.floor(Math.random() * placeholderImages.length);
  return placeholderImages[randomIndex];
}
