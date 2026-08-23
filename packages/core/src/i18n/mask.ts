import { normalizeDigits } from './parser.js';
import { resolvePattern, tokenizePattern, type FormatPreset } from './pattern.js';

/**
 * Mask helper. Given the raw input string and the user-facing format pattern,
 * return the masked value (with separators auto-inserted) AND the suggested
 * caret position. Renderers apply both on every keystroke.
 *
 * Algorithm (token-aware):
 *  1. Tokenize the pattern into numeric tokens + literal separators.
 *  2. Walk the raw input. Digits fill the current token; a token commits when
 *     it reaches its full width, when a separator is typed, or when appending
 *     the next digit would exceed the token's maximum value (e.g. "3" for `M`).
 *  3. Literal separators from the pattern are emitted between committed
 *     tokens; non-digit input characters only act as commit signals.
 *
 * Single-letter tokens (`M`, `d`, `H`, `h`, `m`, `s`) therefore accept 1-2
 * digits, so `12/3/2025` against `M/d/yyyy` stays `12/3/2025` instead of
 * garbling into `1/2/3202`.
 *
 * Names are not masked. Patterns with `MMMM`/`MMM`/`EEEE`/`EEE`/`a` opt out.
 */

const NAME_TOKENS = ['MMMM', 'MMM', 'EEEE', 'EEE', 'a'];

/** Fixed width, and (for variable single-letter tokens) the max field value. */
const NUMERIC_TOKENS: Readonly<Record<string, { width: number; max?: number }>> = {
  yyyy: { width: 4 },
  yy: { width: 2 },
  MM: { width: 2 },
  M: { width: 2, max: 12 },
  dd: { width: 2 },
  d: { width: 2, max: 31 },
  HH: { width: 2 },
  H: { width: 2, max: 23 },
  hh: { width: 2 },
  h: { width: 2, max: 12 },
  mm: { width: 2 },
  m: { width: 2, max: 59 },
  ss: { width: 2 },
  s: { width: 2, max: 59 },
};

export const isMaskable = (pattern: string | FormatPreset): boolean => {
  // Inspect tokens rather than the raw pattern: a substring test also trips on
  // quoted literals, so "yyyy 'ano' MM/dd" would wrongly opt out via the `a` token.
  const resolved = resolvePattern(pattern);
  return !tokenizePattern(resolved).some(
    seg => seg.kind === 'token' && NAME_TOKENS.includes(seg.value),
  );
};

export interface MaskResult {
  readonly value: string;
  readonly caret: number;
}

/** A numeric slot plus the literal text that precedes it in the pattern. */
interface MaskSlot {
  readonly width: number;
  readonly max: number | undefined;
  readonly prefix: string;
}

const buildSlots = (resolved: string): MaskSlot[] => {
  const slots: MaskSlot[] = [];
  let pendingLiteral = '';
  for (const seg of tokenizePattern(resolved)) {
    if (seg.kind === 'literal') {
      pendingLiteral += seg.value;
      continue;
    }
    const spec = NUMERIC_TOKENS[seg.value];
    if (!spec) continue; // name tokens are filtered out by isMaskable
    slots.push({ width: spec.width, max: spec.max, prefix: pendingLiteral });
    pendingLiteral = '';
  }
  return slots;
};

export const applyMask = (input: string, pattern: string | FormatPreset): MaskResult => {
  if (!isMaskable(pattern)) return { value: input, caret: input.length };
  const slots = buildSlots(resolvePattern(pattern));
  // Accept Devanagari/Persian/Arabic-Indic/fullwidth numerals, not just ASCII.
  input = normalizeDigits(input);

  let out = '';
  let slotIdx = 0;
  let buf = ''; // digits typed for the current slot so far
  const commit = (): void => {
    out += buf;
    buf = '';
    slotIdx += 1;
  };

  let i = 0;
  while (i < input.length && slotIdx < slots.length) {
    const ch = input[i] as string;
    if (!/[0-9]/.test(ch)) {
      // Separator/other: commits whatever the current token has so far. A
      // fixed-width token left short is zero-padded ("1/" against MM -> "01"),
      // otherwise it would keep swallowing the next field's digits.
      if (buf !== '') {
        const slot = slots[slotIdx] as MaskSlot;
        if (slot.max === undefined) buf = buf.padStart(slot.width, '0');
        commit();
      }
      i += 1;
      continue;
    }
    const slot = slots[slotIdx] as MaskSlot;
    if (buf === '') out += slot.prefix;
    if (slot.max !== undefined) {
      // Variable 1-2 digit token
      if (buf === '') {
        buf = ch;
        i += 1;
        // No second digit can ever fit (e.g. "3" for M) — commit immediately.
        if (Number(buf) * 10 > slot.max) commit();
      } else if (Number(buf + ch) <= slot.max) {
        buf += ch;
        i += 1;
        commit();
      } else {
        // Digit belongs to the next token; commit and re-process it there.
        commit();
      }
    } else {
      buf += ch;
      i += 1;
      if (buf.length >= slot.width) commit();
    }
  }
  // Partial token stays as typed — never append a trailing separator.
  out += buf;

  return { value: out, caret: out.length };
};
