import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch destination-specific images from Pexels
 * Falls back to Picsum Photos if Pexels API key is not configured
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

async function getPexelsImage(query: string, width: number, height: number): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      // Get the image URL and resize it
      const photo = data.photos[0];
      // Pexels provides src.original, src.large, src.medium, etc.
      // We'll use large and let the browser handle sizing
      return photo.src.large2x || photo.src.large || photo.src.original;
    }
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
  }

  return null;
}

function getPicsumImage(query: string, width: number, height: number): string {
  // Generate deterministic seed from query
  let hash = 0;
  const str = query.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const seed = Math.abs(hash);
  
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const width = parseInt(searchParams.get('width') || '1920');
  const height = parseInt(searchParams.get('height') || '1080');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Try Pexels first if API key is available
  if (PEXELS_API_KEY) {
    const pexelsUrl = await getPexelsImage(query, width, height);
    if (pexelsUrl) {
      return NextResponse.json({ url: pexelsUrl });
    }
  }

  // Fallback to Picsum Photos
  const picsumUrl = getPicsumImage(query, width, height);
  return NextResponse.json({ url: picsumUrl });
}


