'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
  name:   string;
}

export default function ImageGallery({ images, name }: Props) {
  const [idx, setIdx] = useState(0);
  const main = images[idx] ?? null;

  return (
    <div>
      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center mb-3">
        {main ? (
          <Image
            src={main}
            alt={name}
            width={500}
            height={500}
            className="object-contain w-full h-full"
            priority
          />
        ) : (
          <span className="text-7xl">🎁</span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                i === idx ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                width={64}
                height={64}
                className="object-contain w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
