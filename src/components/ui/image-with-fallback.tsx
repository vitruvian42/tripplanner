'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getTripCardImageUrl } from '@/lib/image-service';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  fallbackQuery?: string; // Query to generate fallback image (e.g., destination name)
  fill?: boolean;
  priority?: boolean;
}

export function ImageWithFallback({ 
  src, 
  fallbackSrc, 
  fallbackQuery, 
  alt = '', 
  fill, 
  className, 
  priority, 
  ...props 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  // Generate fallback URL using Gemini if fallbackQuery is provided
  const getFallbackUrl = () => {
    if (fallbackSrc) return fallbackSrc;
    if (fallbackQuery) {
      // Use Gemini to generate a fallback image
      return getTripCardImageUrl(fallbackQuery);
    }
    // Ultimate fallback: generate a generic travel image
    return getTripCardImageUrl('travel destination');
  };

  const finalSrc = imgSrc || getFallbackUrl();
  
  // Build className with proper merging - avoid duplicates
  const imageClassName = cn(
    className,
    fill && 'object-cover absolute inset-0 h-full w-full',
    isLoading ? 'opacity-0' : 'opacity-100',
    'transition-opacity duration-300'
  );

  // Handle src changes - initialize and update
  useEffect(() => {
    if (src !== imgSrc) {
      setImgSrc(src);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  // Check if image is already loaded (for cached images) - run after render
  useEffect(() => {
    const checkImageLoaded = () => {
      if (imageRef.current) {
        if (imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
          setIsLoading(false);
        } else {
          // Image is not loaded yet, wait for onLoad
          setIsLoading(true);
        }
      }
    };
    
    // Check immediately
    checkImageLoaded();
    
    // Also check after a short delay to catch images that load very quickly
    const timeout = setTimeout(checkImageLoaded, 100);
    
    return () => clearTimeout(timeout);
  }, [finalSrc]);

  return (
    <div className={fill ? 'relative' : 'relative'} style={fill ? { width: '100%', height: '100%' } : undefined}>
      {/* Blinking loader - shows while image is loading */}
      {isLoading && (
        <Skeleton 
          className={fill ? 'absolute inset-0 w-full h-full rounded-md' : 'w-full h-full rounded-md'}
        />
      )}
      
      {/* Actual image */}
      <img
        {...props}
        ref={imageRef}
        src={finalSrc}
        alt={alt}
        className={imageClassName}
        onLoad={(e) => {
          setIsLoading(false);
          // Also call original onLoad if provided
          if (props.onLoad) {
            props.onLoad(e);
          }
        }}
        onError={(e) => {
          if (!hasError) {
            setHasError(true);
            setIsLoading(true);
            setImgSrc(getFallbackUrl());
          } else {
            setIsLoading(false);
          }
          // Also call original onError if provided
          if (props.onError) {
            props.onError(e);
          }
        }}
      />
    </div>
  );
}
