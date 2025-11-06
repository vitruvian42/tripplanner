/**
 * Image Service for generating high-quality images
 * Uses API route to generate images with Google Gemini image generation model (gemini-2.5-flash-image)
 * Generates unique, context-aware images for destinations, attractions, and hotels
 */


/**
 * Generate a high-quality image URL for a given query/keyword
 * Returns an API route URL that generates images using Gemini image generation model
 * 
 * @param query - Search query (e.g., "paris", "eiffel tower", "tokyo skyline")
 * @param width - Image width in pixels (default: 1920 for HD)
 * @param height - Image height in pixels (default: 1080 for HD)
 * @param type - Type of image: 'destination' for locations, 'attraction' for attractions/activities
 */
export function getUnsplashImageUrl(
  query: string,
  width: number = 1920,
  height: number = 1080,
  type?: 'destination' | 'attraction'
): string {
  // Use API route to generate images with Gemini image generation
  // The API uses gemini-2.5-flash-image to create context-aware travel images
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const params = new URLSearchParams({
    query: query,
    width: width.toString(),
    height: height.toString(),
  });
  
  if (type) {
    params.append('type', type);
  }
  
  const apiUrl = `${baseUrl}/api/images?${params.toString()}`;
  
  return apiUrl;
}

/**
 * Generate a high-definition image URL for a destination
 * Optimized for banner/hero images (landscape, wide aspect ratio)
 * Uses TripAdvisor-enhanced queries for better destination images
 */
export function getDestinationImageUrl(destination: string): string {
  // Use landscape orientation with 16:9 aspect ratio for banners
  // Dimensions: 1920x1080 (Full HD)
  // Pass 'destination' type for TripAdvisor-style enhanced queries
  return getUnsplashImageUrl(destination, 1920, 1080, 'destination');
}

/**
 * Alias for getDestinationImageUrl for backward compatibility
 */
export const getDestinationImage = getDestinationImageUrl;

/**
 * Generate an image URL for an activity/attraction
 * Optimized for activity cards (landscape, standard aspect ratio)
 * Uses TripAdvisor-enhanced queries for better attraction images
 */
export function getActivityImageUrl(activityTitle: string, destination?: string): string {
  // Combine activity title with destination for better results
  const query = destination 
    ? `${activityTitle} ${destination}`
    : activityTitle;
  
  // Use landscape orientation with 4:3 aspect ratio for cards
  // Dimensions: 1200x900
  // Pass 'attraction' type for TripAdvisor-style enhanced queries
  return getUnsplashImageUrl(query, 1200, 900, 'attraction');
}

/**
 * Generate an image URL for a hotel
 * Optimized for hotel cards (landscape, wide aspect ratio)
 * Uses TripAdvisor-enhanced queries for better hotel images
 */
export function getHotelImageUrl(hotelName: string, destination?: string): string {
  // Combine hotel-related keywords with destination
  const query = destination 
    ? `hotel ${destination}`
    : `hotel ${hotelName}`;
  
  // Use landscape orientation with 16:9 aspect ratio
  // Dimensions: 1920x1080
  // Pass 'destination' type for TripAdvisor-style enhanced queries
  return getUnsplashImageUrl(query, 1920, 1080, 'destination');
}

/**
 * Generate an image URL for trip cards (dashboard)
 * Optimized for card thumbnails (4:3 aspect ratio)
 * Uses TripAdvisor-enhanced queries for better destination images
 */
export function getTripCardImageUrl(destination: string): string {
  // Use landscape orientation with 4:3 aspect ratio
  // Dimensions: 800x600
  // Pass 'destination' type for TripAdvisor-style enhanced queries
  return getUnsplashImageUrl(destination, 800, 600, 'destination');
}

/**
 * Generate multiple image URLs for a destination gallery
 * Returns an array of image URLs with different queries for variety
 * Uses TripAdvisor-enhanced queries for better destination images
 */
export function getDestinationGalleryImages(destination: string, count: number = 5): string[] {
  const keywords = [
    destination,
    `${destination} landmark`,
    `${destination} cityscape`,
    `${destination} attractions`,
    `${destination} travel`,
  ];
  
  return keywords.slice(0, count).map((keyword, index) => {
    // Mix aspect ratios for visual interest
    if (index === 0) {
      // Main image: wide landscape for banner (16:9)
      return getUnsplashImageUrl(keyword, 1920, 1080, 'destination');
    } else {
      // Gallery images: square for grid (1:1)
      return getUnsplashImageUrl(keyword, 800, 800, 'destination');
    }
  });
}

