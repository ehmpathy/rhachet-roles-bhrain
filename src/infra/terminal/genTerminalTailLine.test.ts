import { given, then, when } from 'test-fns';

import { genTerminalTailLine } from './genTerminalTailLine';

/**
 * .what = a fake write stream that records every byte written, with a chosen tty flag
 * .why = the driver's whole contract is the bytes it writes and the tty gate it reads;
 *        a recorder injected through `out` observes both with no real terminal
 */
const genWriteRecorder = (input: {
  isTTY: boolean;
}): { out: NodeJS.WriteStream; writes: string[] } => {
  const writes: string[] = [];
  const out = {
    isTTY: input.isTTY,
    write: (chunk: string) => {
      writes.push(chunk);
      return true;
    },
  } as unknown as NodeJS.WriteStream; // .note = a test double; only isTTY and write are read
  return { out, writes };
};

describe('genTerminalTailLine', () => {
  given('[case1] a pipe (not a tty)', () => {
    when('[t0] lines are overwritten and sealed', () => {
      then('each line is written whole, newline-terminated, no \\r', () => {
        const { out, writes } = genWriteRecorder({ isTTY: false });
        const tail = genTerminalTailLine({ out });
        tail.overwrite('a long first line');
        tail.overwrite('b');
        tail.seal('done');
        expect(tail.isTty).toBe(false);
        expect(writes).toEqual(['a long first line\n', 'b\n', 'done\n']);
      });
    });

    when('[t1] a spin is asked for', () => {
      then('no interval fires — a piped log never fills with frames', () => {
        jest.useFakeTimers();
        try {
          const { out, writes } = genWriteRecorder({ isTTY: false });
          const tail = genTerminalTailLine({ out });
          tail.spin({ render: (frame) => `${frame} wait` });
          jest.advanceTimersByTime(1000);
          expect(writes).toEqual([]);
        } finally {
          jest.useRealTimers();
        }
      });
    });
  });

  given('[case2] a tty', () => {
    when('[t0] a long line is overwritten by a shorter one', () => {
      then('the shorter line is padded to erase the prior tail', () => {
        const { out, writes } = genWriteRecorder({ isTTY: true });
        const tail = genTerminalTailLine({ out });
        tail.overwrite('12345');
        tail.overwrite('ab');
        expect(tail.isTty).toBe(true);
        expect(writes).toEqual(['\r12345', '\rab   ']);
      });
    });

    when('[t1] a line is sealed after an overwrite', () => {
      then('the seal clears the tail, then ends the line', () => {
        const { out, writes } = genWriteRecorder({ isTTY: true });
        const tail = genTerminalTailLine({ out });
        tail.overwrite('1234');
        tail.seal('ok');
        tail.overwrite('x');
        expect(writes).toEqual(['\r1234', '\rok  \n', '\rx']);
      });
    });

    when('[t2] a spin runs, then stops', () => {
      then(
        'frames advance on the cadence, and no frame lands after stop',
        () => {
          jest.useFakeTimers();
          try {
            const { out, writes } = genWriteRecorder({ isTTY: true });
            const tail = genTerminalTailLine({ out });
            tail.spin({ render: (frame) => `${frame} wait` });
            jest.advanceTimersByTime(80 * 2);
            expect(writes).toEqual(['\r⠋ wait', '\r⠙ wait']);
            tail.stop();
            jest.advanceTimersByTime(80 * 5);
            expect(writes).toHaveLength(2);
          } finally {
            jest.useRealTimers();
          }
        },
      );
    });

    when('[t3] a spin is started', () => {
      then(
        'its interval is unref’d, so it never holds the process open',
        () => {
          const unref = jest.fn();
          const spy = jest.spyOn(global, 'setInterval').mockImplementation(
            () => ({ unref }) as unknown as ReturnType<typeof setInterval>, // .note = a timer handle double; only unref is read
          );
          try {
            const { out } = genWriteRecorder({ isTTY: true });
            const tail = genTerminalTailLine({ out });
            tail.spin({ render: (frame) => frame });
            expect(unref).toHaveBeenCalledTimes(1);
          } finally {
            spy.mockRestore();
          }
        },
      );
    });
  });
});
