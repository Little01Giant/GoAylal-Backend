/** Escapes user input so it can be embedded in a RegExp as a literal string. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
