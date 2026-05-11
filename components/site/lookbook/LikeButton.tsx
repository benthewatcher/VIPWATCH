'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isLiked, toggleLiked, subscribe } from '@/lib/wishlist/local';

export function LikeButton({ commissionId }: { commissionId: string }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isLiked(commissionId));
    return subscribe(() => setLiked(isLiked(commissionId)));
  }, [commissionId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLiked(toggleLiked(commissionId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={liked}
      className="absolute top-3 right-3 z-10 grid place-items-center w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 text-white hover:bg-black/65 transition-colors"
    >
      <Heart size={16} className={liked ? 'fill-accent stroke-accent' : 'stroke-white'} />
    </button>
  );
}
