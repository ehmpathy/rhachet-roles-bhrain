import { genTempDir, given, then, useThen, when } from 'test-fns';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { setBrainApplyNote } from './setBrainApplyNote';

/**
 * .what = pins three properties of this op: it appends, it degrades to naught, it leaks
 *         no descriptor
 * .why = it runs once per onStop tick while a stone is parked; an unclosed descriptor per
 *        tick would exhaust the fd table over one session with no error at all
 *
 * .note = a rethrow here would be uncaught inside `child.on('error')`, `console.error` is
 *         forbidden (`F15`), and the log is what failed — so a foreign fault leaves as a
 *         VALUE, and the absorbable class is pinned by a real induced fault
 *
 * .teeth = drop the `finally` close → `[case3]` red; drop `if (!log) return` → `[case2]` red
 */
describe('setBrainApplyNote', () => {
  const asLogPath = (input: { repoRoot: string }): string =>
    path.join(input.repoRoot, '.log', 'bhrain', 'brain', 'apply.log');

  given('[case1] a repo root with a writable log path', () => {
    when('[t0] two notes are appended', () => {
      const scene = useThen('it appends', () => {
        const repoRoot = genTempDir({ slug: 'note-c1', git: true });
        setBrainApplyNote({ repoRoot, text: 'first note' });
        setBrainApplyNote({ repoRoot, text: 'second note' });
        return { repoRoot };
      });

      then('both land, in order, one per line', () => {
        expect(fs.readFileSync(asLogPath(scene), 'utf-8')).toEqual(
          'first note\nsecond note\n',
        );
      });
    });
  });

  given('[case2] a repo root whose .log path is a FILE', () => {
    // .why this shape = it is the absence-shaped fault the header claims to absorb, reached
    //      with no chmod and no host privilege (`rule.forbid.bare-host-deps`)
    when('[t0] a note is appended', () => {
      then('it returns rather than throws, and writes naught', () => {
        // .why = every caller is an `EventEmitter` handler; a throw is uncaught, and on
        //    `getCloneAddress`'s arm it skips the settle, so the halt never renders
        const repoRoot = genTempDir({ slug: 'note-c2', git: true });
        fs.writeFileSync(path.join(repoRoot, '.log'), 'not a directory');

        expect(() =>
          setBrainApplyNote({ repoRoot, text: 'a note with no home' }),
        ).not.toThrow();
      });

      then(
        'and it reports the absence as `fault: null` — a BENIGN degrade',
        () => {
          // .why = the fault leaves as a VALUE, so an absence must report `null` or the
          //    benign/foreign distinction collapses
          const repoRoot = genTempDir({ slug: 'note-c2b', git: true });
          fs.writeFileSync(path.join(repoRoot, '.log'), 'not a directory');

          expect(
            setBrainApplyNote({ repoRoot, text: 'a note with no home' }),
          ).toEqual({ noted: false, fault: null });
        },
      );
    });
  });

  given('[case4] a repo root where the apply.log PATH is a directory', () => {
    // .why EISDIR = FOREIGN (not on `isBrainApplyLogAbsence`'s list) and hermetically
    //    reachable, where `ENOSPC` / `EMFILE` / `EIO` are not. under a bare catch it read
    //    identical to `[case2]`'s absence; this asserts the trace value
    when('[t0] a note is appended', () => {
      const scene = useThen('the tree is prepared', () => {
        const repoRoot = genTempDir({ slug: 'note-c4', git: true });
        fs.mkdirSync(
          path.join(repoRoot, '.log', 'bhrain', 'brain', 'apply.log'),
          { recursive: true },
        );
        return { repoRoot };
      });

      then(
        'it STILL never throws — the never-throw contract is untouched',
        () => {
          // .why = a foreign fault turns visible and stays a value, never an uncaught throw
          expect(() =>
            setBrainApplyNote({ repoRoot: scene.repoRoot, text: 'a note' }),
          ).not.toThrow();
        },
      );

      then(
        'and it carries the foreign code OUT, rather than destroys it',
        () => {
          expect(
            setBrainApplyNote({ repoRoot: scene.repoRoot, text: 'a note' }),
          ).toEqual({ noted: false, fault: 'EISDIR' });
        },
      );
    });
  });

  given('[case3] a stone parked on a repairable cause, tick after tick', () => {
    // .why a fresh fd NUMBER = posix hands out the LOWEST free descriptor, so 50 leaked fds
    //    push the next open's number up by ~50; a portable leak clamp with no `/proc` read
    when('[t0] fifty notes are appended', () => {
      const scene = useThen('it appends fifty', () => {
        const repoRoot = genTempDir({ slug: 'note-c3', git: true });
        const probeBefore = fs.openSync(path.join(repoRoot, 'probe'), 'a');
        fs.closeSync(probeBefore);

        for (let i = 0; i < 50; i += 1)
          setBrainApplyNote({ repoRoot, text: `tick ${i}` });

        const probeAfter = fs.openSync(path.join(repoRoot, 'probe'), 'a');
        fs.closeSync(probeAfter);
        return { repoRoot, probeBefore, probeAfter };
      });

      then('every note landed', () => {
        const lines = fs
          .readFileSync(asLogPath(scene), 'utf-8')
          .trim()
          .split('\n');
        expect(lines).toHaveLength(50);
        expect(lines[0]).toEqual('tick 0');
        expect(lines[49]).toEqual('tick 49');
      });

      then('and NO descriptor leaked — the fresh number is unmoved', () => {
        expect(scene.probeAfter).toEqual(scene.probeBefore);
      });
    });
  });
});
