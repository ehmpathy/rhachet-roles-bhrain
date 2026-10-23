/**
 * .what = the spinner glyphs and their tick cadence, shared by every live review stream
 * .why = the guard's peer stream (`genContextCliEmit`) and review.by's rubric stream
 *        (`genReviewByRubricStreamer`) spin one status line; one declaration keeps them in step
 *        (rule.require.single-source-of-truth-for-render)
 */
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPIN_MS = 80;

/**
 * .what = the terminal-control driver for one live tail line: overwrite it in place, seal it,
 *         and spin it on the shared cadence
 * .why = both live review streams render a tail line the same way — the `\r` overwrite, the
 *        `padEnd(lastLineLen)` erase, the tty gate. one driver is the one source for those
 *        mechanics, so a change to the cadence or the erase moves both surfaces at once
 *        (rule.require.single-source-of-truth-for-render)
 *
 * .note = a spin is tty-only: under a pipe no interval fires, so a piped log never fills with
 *         spinner frames. the caller seals whole lines either way
 */
export const genTerminalTailLine = (input: {
  out: NodeJS.WriteStream;
}): {
  isTty: boolean;
  overwrite: (text: string) => void;
  seal: (text: string) => void;
  spin: (input: { render: (frame: string) => string }) => void;
  stop: () => void;
} => {
  const isTty = input.out.isTTY ?? false;

  // .note = deliberate mutation. a spinner is a terminal-control loop: the interval handle and
  //         the last line width (for the \r overwrite) evolve across callbacks
  //         (rule.require.immutable-vars, annotated-mutation exception)
  let activeInterval: ReturnType<typeof setInterval> | null = null;
  let lastLineLen = 0;

  // stop the spinner, if one spins
  const stop = (): void => {
    if (!activeInterval) return;
    clearInterval(activeInterval);
    activeInterval = null;
  };

  // overwrite the tail line via \r (tty) or print a new line (non-tty)
  const overwrite = (text: string): void => {
    if (isTty) {
      input.out.write(`\r${text.padEnd(lastLineLen)}`);
      lastLineLen = text.length;
      return;
    }
    input.out.write(`${text}\n`);
    lastLineLen = 0;
  };

  // finalize a line: clear the tail line first on a tty, so the sealed line replaces the spinner
  const seal = (text: string): void => {
    if (isTty) {
      input.out.write(`\r${text.padEnd(lastLineLen)}\n`);
      lastLineLen = 0;
      return;
    }
    input.out.write(`${text}\n`);
  };

  // spin the tail line on the shared frames + cadence (tty only)
  const spin = (spinInput: { render: (frame: string) => string }): void => {
    stop();
    if (!isTty) return;
    // .note = deliberate mutation. frameIdx advances each tick to spin the glyph
    let frameIdx = 0;
    activeInterval = setInterval(() => {
      const frame = FRAMES[frameIdx % FRAMES.length]!;
      frameIdx++;
      overwrite(spinInput.render(frame));
    }, SPIN_MS);

    // .note = unref'd: a spinner is decoration, so it must never hold the process open
    //         after the work it decorates has ended
    activeInterval.unref();
  };

  return { isTty, overwrite, seal, spin, stop };
};
