// How a framed photo (<Image fill>) sits in its box. Photos fill the frame (object-cover, focal point = objectPosition).
// Images with lettering (signboards, wall panels, door signs) are marked fit "contain" in images.json: they are always
// shown whole, on a background sampled from their own edges, so no letter is ever cut (owner, 30 Oct 2026).
import type { CSSProperties } from 'react';

export type Framable = { objectPosition?: string; fit?: 'cover' | 'contain'; background?: string };

export const fitClass = (img: Framable) => (img.fit === 'contain' ? 'object-contain' : 'object-cover');

export const fitStyle = (img: Framable): CSSProperties => ({ objectPosition: img.objectPosition, background: img.background });
