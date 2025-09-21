'use client';

import React, { useState } from 'react';
import { defaultPlaceholderImage } from '@/lib/placeholder-images';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fill?: boolean;
}

export function ImageWithFallback({ src, fallbackSrc = defaultPlaceholderImage.imageUrl, alt, fill, className, priority, ...props }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);

  const combinedClassName = `${className || ''} ${fill ? 'object-cover absolute inset-0 h-full w-full' : ''}`.trim();

  return (
    <img
      {...props}
      src={imgSrc as string}
      alt={alt || ''}
      className={combinedClassName}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
