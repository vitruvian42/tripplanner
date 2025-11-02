import placeholderData from './placeholder-images.json';
import { getTripCardImageUrl, getDestinationImageUrl } from './image-service';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const placeholderImages = placeholderData.placeholderImages;

export const placeholderImageById: { [key: string]: typeof placeholderImages[0] } = {};
placeholderImages.forEach(image => {
  placeholderImageById[image.id] = image;
});

export const defaultPlaceholderImage = placeholderImageById['new-york']; // Fallback to a default image

/**
 * Selects a relevant placeholder image based on the destination.
 * Uses real Unsplash images with proper aspect ratios.
 * Prioritizes exact matches, then partial matches, then generates a new image URL.
 */
export function getRelevantPlaceholderImage(destination: string): ImagePlaceholder {
  const lowerCaseDestination = destination.toLowerCase();

  // 1. Try to find an exact match by ID
  const exactMatch = placeholderImages.find(image => image.id === lowerCaseDestination);
  if (exactMatch) {
    // Return with updated high-definition URL
    return {
      ...exactMatch,
      imageUrl: getTripCardImageUrl(destination),
    };
  }

  // 2. Try to find a partial match in description or hint
  const partialMatch = placeholderImages.find(image => 
    image.description.toLowerCase().includes(lowerCaseDestination) ||
    image.imageHint.toLowerCase().includes(lowerCaseDestination)
  );
  if (partialMatch) {
    // Return with updated high-definition URL
    return {
      ...partialMatch,
      imageUrl: getTripCardImageUrl(destination),
    };
  }

  // 3. Generate a new image URL for the destination
  return {
    id: lowerCaseDestination,
    description: `${destination} travel destination`,
    imageUrl: getTripCardImageUrl(destination),
    imageHint: `${lowerCaseDestination} travel`,
  };
}

/**
 * Get a high-definition image URL for a destination (for banners/hero images)
 */
export function getDestinationImage(destination: string): string {
  return getDestinationImageUrl(destination);
}
