/**
 * Shrinks a photo to a tiny JPEG and returns it as base64 (for pixel analysis).
 * Supports both the new (SDK 52+) and the legacy expo-image-manipulator API.
 */
export async function downscaleToBase64(uri: string, width = 96): Promise<string> {
  const mod: any = await import('expo-image-manipulator');
  const format = mod.SaveFormat?.JPEG ?? 'jpeg';
  if (mod.ImageManipulator?.manipulate) {
    const ctx = mod.ImageManipulator.manipulate(uri);
    ctx.resize({ width });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ format, compress: 0.9, base64: true });
    if (!out.base64) throw new Error('No base64 data');
    return out.base64 as string;
  }
  const out = await mod.manipulateAsync(uri, [{ resize: { width } }], { compress: 0.9, format, base64: true });
  if (!out.base64) throw new Error('No base64 data');
  return out.base64 as string;
}
