'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { defaultPlaceholderImage } from '@/lib/placeholder-images';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export function ImageWithFallback({ src, fallbackSrc = defaultPlaceholderImage.imageUrl, alt, ...props }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
