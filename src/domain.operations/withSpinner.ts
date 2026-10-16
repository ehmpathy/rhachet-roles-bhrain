import { isProgressSilenced } from '@src/domain.operations/isProgressSilenced';

/**
 * .what = draws an elapsed-time spinner while an operation runs
 * .why = shows progress for a long brain call (rule.require.status-feedback)
 * .note = silent when `isProgressSilenced`, since the caller draws its own
 * .note = display only. the deadline lives in `withDeadline`, so a bound never
 *         depends on whether a spinner draws (raised i041/r027)
 */
export const withSpinner = async <T>(input: {
  message: string;
  operation: () => Promise<T>;
}): Promise<T> => {
  // stay silent where a buffered caller renders the progress itself
  if (isProgressSilenced({ env: process.env })) return await input.operation();

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();

  // .note = deliberate mutation. a spinner frame is display state advanced by a
  //         timer tick, so there is no value to thread through — the closure IS
  //         the scope, and the counter never escapes it (rule.require.immutable-vars)
  let i = 0;

  // print title once
  console.log(input.message);

  // render only the elapsed time branch line
  const render = (frame: string) => {
    const elapsed = getOneSecondsElapsed({
      since: startTime,
      until: Date.now(),
    });
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ${frame}  `);
  };

  render(frames[0]!);
  const interval = setInterval(() => {
    i = (i + 1) % frames.length;
    render(frames[i]!);
  }, 100);

  try {
    const result = await input.operation();
    clearInterval(interval);
    const elapsed = getOneSecondsElapsed({
      since: startTime,
      until: Date.now(),
    });
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ✓\n\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    const elapsed = getOneSecondsElapsed({
      since: startTime,
      until: Date.now(),
    });
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ✗\n`);
    throw error;
  }
};

/**
 * .what = how many whole seconds lie between two epoch-ms instants
 * .why = the spinner reads elapsed time at three sites; one named home keeps the grain
 *        (whole seconds, floored) in one place rather than three inline copies
 *        (rule.forbid.inline-decode-friction)
 */
const getOneSecondsElapsed = (input: {
  since: number;
  until: number;
}): number => Math.floor((input.until - input.since) / 1000);
