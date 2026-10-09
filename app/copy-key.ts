export function copyEntryId(he: string, ar: string, en?: string) {
  const source = JSON.stringify([he, ar, en ?? null]);
  let first = 2_166_136_261;
  let second = 3_266_489_917;
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    first = Math.imul(first ^ code, 16_777_619);
    second = Math.imul(second ^ code, 2_246_822_519);
  }
  return `c-${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}
