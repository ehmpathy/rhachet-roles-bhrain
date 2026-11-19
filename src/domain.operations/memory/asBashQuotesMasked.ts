/**
 * .what = a bash command line with every quoted or escaped char masked, same length
 * .why = an operator inside quotes (`cp "a;b" M`) or after a backslash (`echo \;`)
 *        parts no command; the mask hides it from every operator scan, while each
 *        offset still lines up with the original
 *
 * tracks:
 * - '…' = no escape inside; the next ' closes it
 * - "…" = a backslash escapes the next char; the next unescaped " closes it
 * - $'…' = a backslash escapes the next char; the next unescaped ' closes it
 * - a backslash outside quotes escapes the next char
 *
 * .note = quote chars themselves stay; only what they guard, and escaped chars, mask
 * .note = deliberate mutation: one pass, one array. the guard runs inside a hook with
 *         a 5s budget, and a per-char copy made a 20KB heredoc quadratic
 */
export const asBashQuotesMasked = (input: { command: string }): string => {
  // index by utf-16 code unit, as String.slice does, so an emoji keeps each offset
  const chars = input.command;
  const masked: string[] = [];
  let quote: "'" | '"' | "$'" | null = null;
  let escaped = false;
  for (let index = 0; index < chars.length; index++) {
    const char = chars[index] ?? '';

    // an escaped char is masked, whatever it is
    if (escaped) {
      escaped = false;
      masked.push('_');
      continue;
    }

    // a backslash escapes the next char, except inside a plain '…' span
    if (char === '\\' && quote !== "'") {
      escaped = true;
      masked.push('_');
      continue;
    }

    // outside quotes, a quote char opens a span; `$'` opens an escape-aware one
    if (quote === null && (char === '"' || char === "'")) {
      quote = char === "'" && chars[index - 1] === '$' ? "$'" : char;
      masked.push(char);
      continue;
    }

    // inside a span, its own close char closes it
    const closer = quote === "$'" ? "'" : quote;
    if (quote !== null && char === closer) {
      quote = null;
      masked.push(char);
      continue;
    }

    // inside a span, the char is masked; outside, it stays
    masked.push(quote === null ? char : '_');
  }
  return masked.join('');
};
