import { Directory, File, Paths } from 'expo-file-system';
import { uid } from '@/utils/format';

/**
 * Camera / picker URIs live in the cache directory (the OS may purge it).
 * Copy the photo to the app's document directory so that it survives restarts.
 */
export function persistPhoto(uri: string): string {
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create();
    const dest = new File(dir, `${uid()}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri; // worst case keep the original URI
  }
}

/** Download a remote image to the cache (used for the demo photo in the recognizer). */
export async function downloadToCache(url: string): Promise<string> {
  const dest = new File(Paths.cache, `${uid()}.jpg`);
  const file = await File.downloadFileAsync(url, dest);
  return file.uri;
}
