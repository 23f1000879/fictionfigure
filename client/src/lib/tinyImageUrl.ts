/** Small delivery URLs for decorative image washes and aspect-ratio probes. */
export function tinyImageUrl(src: string, width: 32 | 64, quality = 25): string {
  if (!src || /^(data:|blob:)/i.test(src) || /\.svg(?:[?#]|$)/i.test(src)) return src;

  if (src.startsWith("/_next/image?")) {
    const params = new URLSearchParams(src.slice(src.indexOf("?") + 1));
    params.set("w", String(width)); params.set("q", String(quality));
    return `/_next/image?${params.toString()}`;
  }

  // Append the tiny transformation after any existing transforms, before the
  // upload version, so a previous w_1600 cannot undo the smaller delivery size.
  if (src.startsWith("https://res.cloudinary.com/") && src.includes("/upload/")) {
    const marker = src.indexOf("/upload/") + 8;
    const tail = src.slice(marker);
    const version = /(?:^|\/)v\d+\//.exec(tail);
    if (version) {
      const offset = version.index + (tail[version.index] === "/" ? 1 : 0);
      return `${src.slice(0, marker)}${tail.slice(0, offset)}c_limit,w_${width},q_${quality},f_auto/${tail.slice(offset)}`;
    }
  }

  // Use the existing Next image optimizer instead of downloading an original
  // multi-megabyte file just to blur it or inspect its dimensions.
  if (src.startsWith("/") || /^https?:\/\//i.test(src)) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }
  return src;
}
