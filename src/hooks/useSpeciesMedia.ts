import { useEffect, useState } from 'react';
import { getSpeciesMedia, peekMedia, type SpeciesMedia } from '@/services/wikipedia';
import { useOnline } from './useOnline';

/** Photo URLs for a species (cached; refetched when the connection comes back). */
export function useSpeciesMedia(wiki?: string): SpeciesMedia | null {
  const online = useOnline();
  const [media, setMedia] = useState<SpeciesMedia | null>(wiki ? (peekMedia(wiki) ?? null) : null);
  useEffect(() => {
    if (!wiki) return;
    let alive = true;
    getSpeciesMedia(wiki).then((m) => {
      if (alive && m) setMedia(m);
    });
    return () => {
      alive = false;
    };
  }, [wiki, online]);
  return media;
}
