import { resolvePattern, type FormatPreset } from './pattern.js';

/**
 * Mask helper. Given the raw input string and the user-facing format pattern,
 * return the masked value (with separators auto-inserted) AND the suggested
 * caret position. Renderers apply both on every keystroke.
 *
 * Algorithm:
 *  1. Strip all non-digit characters from the input.
 *  2. Walk through the pattern. For each digit token char (`y`, `M`, `d`, `H`,
 *     `h`, `m`, `s`), consume one digit from the stripped input. For literal
 *     characters (separators, spaces) in the pattern, emit them verbatim.
 *  3. Stop when there are no more digits to consume.
 *
 * Names are not masked. Patterns with `MMMM`/`MMM`/`EEEE`/`EEE`/`a` opt out.
 */

const DIGIT_TOKENS = new Set(['y', 'M', 'd', 'H', 'h', 'm', 's']);
const NAME_TOKENS = ['MMMM', 'MMM', 'EEEE', 'EEE', 'a'];

export const isMaskable = (pattern: string | FormatPreset): boolean => {
  const resolved = resolvePattern(pattern);
  return !NAME_TOKENS.some(t => resolved.includes(t));
};

export interface MaskResult {
  readonly value: string;
  readonly caret: number;
}

export const applyMask = (input: string, pattern: string | FormatPreset): MaskResult => {
  if (!isMaskable(pattern)) return { value: input, caret: input.length };
  const resolved = resolvePattern(pattern);
  const digits = input.replace(/\D+/g, '');

  let out = '';
  let i = 0; // pos in resolved
  let d = 0; // pos in digits

  while (i < resolved.length) {
    const ch = resolved[i] as string;
    if (DIGIT_TOKENS.has(ch)) {
      if (d >= digits.length) break;
      out += digits[d];
      d += 1;
      i += 1;
    } else {
      // Literal. Emit only if we have digits before AND digits after.
      // Avoid trailing separators when the user hasn't typed the next token yet.
      if (d === 0) break;
      // Look ahead: is there another digit token after this literal?
      let hasMore = false;
      for (let j = i + 1; j < resolved.length; j += 1) {
        if (DIGIT_TOKENS.has(resolved[j] as string)) {
          hasMore = true;
          break;
        }
      }
      if (!hasMore) {
        // No more digit tokens — bail out so we don't append a trailing literal.
        break;
      }
      // If we already have all the digits for the preceding token, emit the
      // literal. Otherwise stop (user is mid-token).
      if (d >= digits.length) break;
      out += ch;
      i += 1;
    }
  }

  return { value: out, caret: out.length };
};
