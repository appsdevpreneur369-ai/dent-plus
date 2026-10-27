// next/image custom loader: serves the pre-generated WebP variants from public/images/opt (no runtime resizing).
import { IMAGE_WIDTHS } from './image-widths.mjs';

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const m = src.match(/^\/(?:images\/photos|brand)\/([^/]+)\.(?:jpe?g|png|webp)$/i);
  if (!m) return src; // anything else is served as-is
  const w = IMAGE_WIDTHS.find((x) => x >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  return `/images/opt/${m[1]}-${w}.webp`;
}
