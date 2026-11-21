/** Friendly storefront labels without changing stored category names or URLs. */
export function collectionLabel(name: string): string {
  const value = name.trim();
  if (/one\s*piece/i.test(value)) return "One Piece";
  if (/demon\s*slayer/i.test(value)) return "Demon Slayer";
  if (/dragon\s*ball/i.test(value)) return "Dragon Ball";
  if (/mystery|trnendy/i.test(value)) return "Mystery boxes";
  if (/manga|novels/i.test(value)) return "Manga & novels";
  if (/doraemon|doaremon/i.test(value)) return "Doraemon";
  if (/^marvel$/i.test(value)) return "Marvel";
  if (/tapestr/i.test(value)) return "Tapestries";
  return value === value.toUpperCase() ? value.charAt(0) + value.slice(1).toLowerCase() : value;
}
