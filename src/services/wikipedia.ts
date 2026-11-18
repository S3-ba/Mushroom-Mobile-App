import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchJson } from './http';

export interface SpeciesMedia {
  card?: string;
  hero?: string;
  page?: string;
  title?: string;
}

interface WikiSummary {
  title?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  content_urls?: { desktop?: { page?: string } };
}

const memory = new Map<string, SpeciesMedia>();
const inflight = new Map<string, Promise<SpeciesMedia | null>>();

// Wikimedia serves thumbnails in a fixed set of widths (330, 500, 960 …).
const resize = (url: string, width: number) => url.replace(/\/(\d+)px-/, `/${width}px-`);

export const peekMedia = (wiki: string) => memory.get(wiki);

/**
 * Photo + attribution for a species from the Wikipedia REST API.
 * Result is cached in AsyncStorage – so the atlas keeps its metadata offline.
 * (Image bytes are cached on disk by expo-image.)
 */
export function getSpeciesMedia(wiki: string): Promise<SpeciesMedia | null> {
  const hit = memory.get(wiki);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(wiki);
  if (pending) return pending;

  const job = (async (): Promise<SpeciesMedia | null> => {
    const key = `media:v1:${wiki}`;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw) as SpeciesMedia;
        memory.set(wiki, cached);
        return cached;
      }
    } catch {
      /* ignore cache errors */
    }
    try {
      const json = await fetchJson<WikiSummary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wiki.replace(/ /g, '_'))}`);
      const thumb = json.thumbnail?.source;
      if (!thumb) return null;
      const ow = json.originalimage?.width ?? 0;
      const media: SpeciesMedia = {
        card: ow >= 500 ? resize(thumb, 500) : thumb,
        hero: ow >= 960 ? resize(thumb, 960) : ow >= 500 ? resize(thumb, 500) : (json.originalimage?.source ?? thumb),
        page: json.content_urls?.desktop?.page,
        title: json.title,
      };
      memory.set(wiki, media);
      AsyncStorage.setItem(key, JSON.stringify(media)).catch(() => {});
      return media;
    } catch {
      return null; // offline / API error — UI falls back to the built-in illustration
    }
  })();

  inflight.set(wiki, job);
  job.finally(() => inflight.delete(wiki));
  return job;
}
