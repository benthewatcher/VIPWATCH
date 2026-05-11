'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { getWishlist, subscribe } from '@/lib/wishlist/local';

export function UserMenu({ locale }: { locale: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getWishlist().length);
    return subscribe(() => setCount(getWishlist().length));
  }, []);

  return (
    <Link
      href={`/${locale}/wishlist`}
      className="relative text-text-muted hover:text-accent"
      aria-label="Wishlist"
    >
      <Heart size={18} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-bg-primary text-[10px] leading-[16px] text-center font-medium">
          {count}
        </span>
      )}
    </Link>
  );
}
