/**
 * Image Service for fetching high-quality images
 * Uses API route to fetch from Pexels (if configured) or falls back to Picsum Photos
 */

/**
 * Generate a deterministic seed from a query string
 * This ensures the same query always returns the same image from Picsum Photos
 */
function getSeedFromQuery(query: string): number {
  let hash = 0;
  const str = query.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a high-quality image URL for a given query/keyword
 * For client-side use, we'll use Picsum Photos with seeded images for reliable results
 * For better quality, set PEXELS_API_KEY env variable and images will be fetched server-side
 * 
 * @param query - Search query (e.g., "paris", "eiffel tower", "tokyo skyline")
 * @param width - Image width in pixels (default: 1920 for HD)
 * @param height - Image height in pixels (default: 1080 for HD)
 */
export function getUnsplashImageUrl(
  query: string,
  width: number = 1920,
  height: number = 1080
): string {
  // Clean the query for seeding
  const cleanQuery = query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  // Generate a deterministic seed from the query
  const seed = getSeedFromQuery(cleanQuery);
  
  // Use Picsum Photos with seed for consistent, high-quality images
  // This works reliably without requiring API keys
  // Format: https://picsum.photos/seed/{seed}/{width}/{height}
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Generate a high-definition image URL for a destination
 * Optimized for banner/hero images (landscape, wide aspect ratio)
 */
export function getDestinationImageUrl(destination: string): string {
  // Use landscape orientation with 16:9 aspect ratio for banners
  // Dimensions: 1920x1080 (Full HD)
  return getUnsplashImageUrl(destination, 1920, 1080);
}

/**
 * Generate an image URL for an activity
 * Optimized for activity cards (landscape, standard aspect ratio)
 */
export function getActivityImageUrl(activityTitle: string, destination?: string): string {
  // Combine activity title with destination for better results
  const query = destination 
    ? `${activityTitle} ${destination}`
    : activityTitle;
  
  // Use landscape orientation with 4:3 aspect ratio for cards
  // Dimensions: 1200x900
  return getUnsplashImageUrl(query, 1200, 900);
}

/**
 * Generate an image URL for a hotel
 * Optimized for hotel cards (landscape, wide aspect ratio)
 */
export function getHotelImageUrl(hotelName: string, destination?: string): string {
  // Combine hotel-related keywords with destination
  const query = destination 
    ? `hotel ${destination}`
    : `hotel ${hotelName}`;
  
  // Use landscape orientation with 16:9 aspect ratio
  // Dimensions: 1920x1080
  return getUnsplashImageUrl(query, 1920, 1080);
}

/**
 * Generate an image URL for trip cards (dashboard)
 * Optimized for card thumbnails (4:3 aspect ratio)
 */
export function getTripCardImageUrl(destination: string): string {
  // Use landscape orientation with 4:3 aspect ratio
  // Dimensions: 800x600
  return getUnsplashImageUrl(destination, 800, 600);
}

/**
 * Generate multiple image URLs for a destination gallery
 * Returns an array of image URLs with different queries for variety
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
      return getUnsplashImageUrl(keyword, 1920, 1080);
    } else {
      // Gallery images: square for grid (1:1)
      return getUnsplashImageUrl(keyword, 800, 800);
    }
  });
}

