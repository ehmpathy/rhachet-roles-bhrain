import { asReviewBodyStdout } from './asReviewBodyStdout';

/**
 * .what = drops a run of whitespace + ansi escapes off the front of a string
 * .why = the captured review stdout may OPEN with blank line(s) (and, off a tty, ansi bytes) AHEAD
 *        of the `🪨` banner — the exact front asReviewBodyStdout tolerates. the streamer measures
 *        "am i still inside the header region" against the text PAST this front, so a blank first
 *        line is not mistaken for the body.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
const FRONT_WHITESPACE_AND_ANSI = /^(?:\s|\x1b\[[0-9;]*m)*/;

/**
 * .what = the literal head of the rhx dispatch banner line
 * .why = kept in sync with asReviewBodyStdout's banner regex. the streamer uses it to tell a partial
 *        banner ("🪨 run sol…", still to complete) from real body content — so it holds a half-arrived
 *        banner instead of a leak of it as body.
 */
const BANNER_HEAD = '🪨 run solid skill';

/**
 * .what = tells whether the held lead is STILL inside the strippable header region (front blanks +
 *         an optional banner line + the blank lines after it), so more chunks must be held before a
 *         strip can commit
 * .why = asReviewBodyStdout removes `front-whitespace + banner-line + trailing-blank-lines`. a strip
 *        is only safe to commit once the lead reaches the first BODY character past that whole region
 *        — else a chunk boundary that lands mid-banner (leak the banner) or right after the banner's
 *        newline (leak the post-banner blank line) would corrupt the stream. this predicate holds the
 *        lead through every ambiguous boundary until the body definitively begins.
 */
const holdsInHeaderRegion = (input: { lead: string }): boolean => {
  const past = input.lead.replace(FRONT_WHITESPACE_AND_ANSI, '');

  // only whitespace so far — a banner may still follow, so hold
  if (past === '') return true;

  // a partial banner head ("🪨 run sol…") — could still complete into a banner, so hold. covers a
  // chunk boundary that splits the multi-byte 🪨 or lands mid-banner-head.
  if (BANNER_HEAD.startsWith(past)) return true;

  // a full banner head: hold while the banner line itself is unterminated, then hold while
  // everything after it is still blank (the trailing blank lines asReviewBodyStdout also strips) —
  // release only when the first non-blank body character past the banner arrives
  if (past.startsWith(BANNER_HEAD)) {
    const afterHead = past.slice(BANNER_HEAD.length);
    const bannerLineEnd = afterHead.indexOf('\n');
    if (bannerLineEnd === -1) return true; // banner line not yet terminated
    const afterBanner = afterHead.slice(bannerLineEnd + 1);
    return /^\s*$/.test(afterBanner); // only trailing blanks so far → hold
  }

  // real, non-banner content has begun — no banner to strip; release now
  return false;
};

/**
 * .what = a stateful streamer that emits a captured review's BODY progressively — it strips the
 *         front rhx dispatch banner off the live stream, then passes every later chunk through
 * .why = a human `review.by --for` run streams the child `rhx review` stdout live so the review
 *        arrives progressively (rule.require.status-feedback). that raw capture OPENS with the inner
 *        `rhx review` subprocess's own dispatch banner — so a live tee of it would show that banner
 *        ON TOP of the outer `…skill=review.by` banner the harness already stamped: the DOUBLED
 *        banner asReviewBodyStdout exists to kill. so the live stream must be banner-stripped too,
 *        exactly as the buffered stamp is. this streamer strips the front banner, then streams the
 *        rest verbatim — so the concatenation of all it emits is byte-identical to
 *        asReviewBodyStdout(fullCapture), i.e. the human watches live EXACTLY the disintermediated
 *        body the buffered path would stamp. see rule.require.review-by-disintermediates.
 * .how = hold chunks while the lead is still inside the strippable header region (holdsInHeaderRegion
 *        — front blanks + banner line + trailing blanks). the instant the first body character past
 *        that region arrives, run asReviewBodyStdout on the held lead (which removes exactly that
 *        region), emit the body-start it yields, and stream every later chunk raw. asReviewBodyStdout's
 *        strip is anchored at `^`, so a strip of the held lead plus a raw pass of the remainder equals
 *        a strip of the whole (a review body holds no later banner).
 */
export const genReviewBodyStreamer = (input: {
  write: (text: string) => void;
}): {
  /** feed one raw stdout chunk; emits the banner-stripped body progressively */
  onChunk: (chunk: string) => void;
  /** call once the stream ends, to flush a lead still inside the header region */
  done: () => void;
} => {
  // .note = deliberate mutation. `lead` holds chunks through the header region, and `flushed` flips
  //         once past it; a stateful streamer needs both to persist across many onChunk calls
  //         (rule.require.immutable-vars — annotated-mutation exception).
  let lead = '';
  let flushed = false;

  const onChunk = (chunk: string): void => {
    // past the header region: every later chunk is body, streamed verbatim
    if (flushed) {
      input.write(chunk);
      return;
    }

    // still inside the header region: hold this chunk and wait for the body to begin
    lead += chunk;
    if (holdsInHeaderRegion({ lead })) return;

    // the body has begun: strip the front banner + surrounding blanks off the held lead, emit the
    // body-start, then let every later chunk pass through raw
    flushed = true;
    input.write(asReviewBodyStdout({ stdout: lead }));
    lead = '';
  };

  const done = (): void => {
    // the stream ended while still inside the header region (a review that never reached a body
    // character): flush whatever was held, banner-stripped, so no lead is lost
    if (flushed || lead === '') return;
    input.write(asReviewBodyStdout({ stdout: lead }));
    lead = '';
    flushed = true;
  };

  return { onChunk, done };
};
