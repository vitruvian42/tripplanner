import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to generate images using Google Gemini image generation model
 * Uses gemini-2.5-flash-image for creating trip thumbnails, banners, and attraction images
 * 
 * Reference: https://ai.google.dev/gemini-api/docs/image-generation
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

/**
 * Determine aspect ratio based on width and height
 * Returns one of the supported aspect ratios: 1:1, 16:9, 4:3, 3:2, 2:3, 9:16, etc.
 */
function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  
  // Match to closest supported aspect ratio
  if (Math.abs(ratio - 1.0) < 0.1) return '1:1'; // Square
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9'; // Wide landscape
  if (Math.abs(ratio - 9/16) < 0.1) return '9:16'; // Portrait
  if (Math.abs(ratio - 4/3) < 0.1) return '4:3'; // Standard landscape
  if (Math.abs(ratio - 3/4) < 0.1) return '3:4'; // Portrait
  if (Math.abs(ratio - 3/2) < 0.1) return '3:2'; // Wide landscape
  if (Math.abs(ratio - 2/3) < 0.1) return '2:3'; // Portrait
  if (Math.abs(ratio - 21/9) < 0.1) return '21:9'; // Ultra wide
  
  // Default based on orientation
  return ratio > 1 ? '16:9' : '1:1';
}

/**
 * Create a descriptive prompt for image generation based on query and type
 */
function createImagePrompt(query: string, type?: string): string {
  const cleanQuery = query.trim();
  
  if (type === 'attraction') {
    return `Create a beautiful, high-quality photograph of ${cleanQuery}, a famous tourist attraction or landmark. The image should be professional travel photography quality, showing the attraction in its best light with vibrant colors, clear details, and an inviting atmosphere. Include tourists or visitors if appropriate to show the scale and popularity of the location.`;
  } else if (type === 'destination') {
    return `Create a beautiful, high-quality photograph of ${cleanQuery} as a travel destination. The image should showcase the city's or location's most iconic and attractive features - famous landmarks, beautiful architecture, vibrant streets, scenic views, or cultural highlights. Professional travel photography style with vibrant colors, clear composition, and an inviting atmosphere that makes viewers want to visit.`;
  } else {
    // Default: general travel/tourism image
    return `Create a beautiful, high-quality travel photograph of ${cleanQuery}. Professional travel photography style with vibrant colors, clear composition, and an inviting atmosphere.`;
  }
}

/**
 * Generate image using Gemini image generation model
 * Returns base64-encoded image data
 */
async function generateGeminiImage(
  query: string,
  type?: string,
  aspectRatio: string = '16:9'
): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return null;
  }

  try {
    const prompt = createImagePrompt(query, type);
    
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            imageConfig: {
              aspectRatio: aspectRatio,
            },
            responseModalities: ['IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    // Extract image data from response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            // Return data URL for the image
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating image with Gemini:', error);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const width = parseInt(searchParams.get('width') || '1920');
  const height = parseInt(searchParams.get('height') || '1080');
  const format = searchParams.get('format'); // 'json', 'data-url', or 'image' (default)
  const type = searchParams.get('type'); // 'destination', 'attraction', or default

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Determine aspect ratio for Gemini
  const aspectRatio = getAspectRatio(width, height);

  // Generate image using Gemini
  const imageDataUrl = await generateGeminiImage(query, type || undefined, aspectRatio);

  if (!imageDataUrl) {
    return NextResponse.json(
      { error: 'Failed to generate image. Please ensure GEMINI_API_KEY is set.' },
      { status: 500 }
    );
  }

  // If format is 'json', return the data URL
  if (format === 'json' || format === 'data-url') {
    return NextResponse.json({ url: imageDataUrl, type: 'data-url' });
  }

  // If format is 'image' or default, return the image directly
  // Extract base64 data and mime type from data URL
  const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return NextResponse.json({ error: 'Invalid image data format' }, { status: 500 });
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Return the image with proper content type
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
    },
  });
}


