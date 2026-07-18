'use client';

import { House } from 'lucide-react';
import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

type FallbackImageProps = Omit<ImageProps, 'src'> & {
  src?: ImageProps['src'] | null;
};

export default function FallbackImage({ src, alt, onError, ...props }: FallbackImageProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => setFailed(!src), [src]);

  if (failed || !src) {
    return (
      <div
        className={`image-fallback${props.fill ? ' fill' : ''}`}
        style={
          props.fill
            ? undefined
            : {
                width: typeof props.width === 'number' ? props.width : undefined,
                height: typeof props.height === 'number' ? props.height : undefined,
              }
        }
        role="img"
        aria-label={`${alt}. Photo unavailable`}
      >
        <House size={28} strokeWidth={1.6} />
        <span>Photo unavailable</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
