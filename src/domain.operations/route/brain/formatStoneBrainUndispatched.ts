import { WHOAMI_TIMEOUT_MS } from './getCloneAddress';
import type { StoneBrainHaltCause } from './setStoneBrain';

/**
 * .what = the probe cap, in the seconds a human reads, DERIVED from the cap itself
 * .why = three halt rows quote it; a typed copy drifted (`2s` against a 10s cap) and every
 *        snapshot passed — a snapshot pins what renders, never whether it is true
 */
const CAP_SECONDS = `${WHOAMI_TIMEOUT_MS / 1_000}s`;

/**
 * .what = the one command that restores dispatchability for an unenrolled driver
 * .why = `unenrolled` and `timed-out` both hand it out, and must not drift apart
 */
const CMD_ENROLL = 'rhx enroll claude --as @:driver --roles driver';

/**
 * .what = the diagnosis and the remedy each halt cause carries
 * .why = one halt per cause, so no driver is handed a fix that cannot work for their case
 *        (`rule.require.errors-name-the-fix`)
 *
 * .note = a table rather than a switch, so a reviewer checks cells side by side
 * .note = each `why` entry is ONE sentence, because each renders as one leaf of the tree
 * .note = `timed-out` names NO diagnosis: the cap fires before the probe reported aught. it
 *         carries an `also` with `unenrolled`'s remedy, because which of the two a driver
 *         sees is decided by a wall-clock race (a fast probe exits 2, a slow one hits the
 *         cap). `formatStoneBrain.test.ts` clamps that both rows hand out the same command
 * .note = `live` varies in KIND: an unenrolled driver has no address; a `spawn-failed` one
 *         confirmed its address and still sent naught
 */
const HALTS: Record<
  StoneBrainHaltCause,
  {
    live: string;
    why: string[];
    fix: { says: string; cmd: string };
    also?: { says: string; cmd: string };
  }
> = {
  unenrolled: {
    live: 'unknown — no clone address was confirmed',
    why: [
      'this driver is not an enrolled clone, so `clone say` has naught to address',
      'the usual cause is a driver launched directly rather than by `rhx enroll`',
    ],
    fix: {
      says: 're-enroll the driver with a slug, then re-enter the stone',
      cmd: CMD_ENROLL,
    },
  },
  'unreadable-clone': {
    live: 'unknown — the clone probe could not be read',
    why: [
      '`clone whoami` did not answer, or failed for a reason this build does not read',
      `the probe is capped at ${CAP_SECONDS}, well under the driver hook budget`,
    ],
    fix: {
      says: 'run the probe by hand and read what it reports',
      cmd: 'rhx clone whoami --output json',
    },
  },
  'timed-out': {
    live: 'unknown — the clone probe did not answer in time',
    why: [
      `\`clone whoami\` was still alive at the ${CAP_SECONDS} cap, and was killed`,
      'the cap names no cause — the probe may have been about to report any of them',
    ],
    fix: {
      says: 'run the probe by hand, unhurried, and read what it reports',
      cmd: 'rhx clone whoami --output json',
    },
    also: {
      says: 'if it reports an unenrolled driver — the most common cause — re-enroll',
      cmd: CMD_ENROLL,
    },
  },
  'unreadable-payload': {
    live: 'unknown — the clone probe wrote no readable json',
    why: [
      '`clone whoami` exited 0, and what it wrote is not json at all',
      'a clean exit beside unreadable output means the INSTRUMENT is broken, not the payload',
    ],
    fix: {
      says: 'read the raw output, and report what it emitted instead of json',
      cmd: 'rhx clone whoami --output json',
    },
  },
  'unreadable-address': {
    live: 'unknown — the clone payload carried no address',
    why: [
      '`clone whoami` answered cleanly, and its payload held no address this build can use',
      'the usual cause is a rhachet version whose payload shape this driver does not yet read',
    ],
    fix: {
      says: 'read the payload, then report the shape it carries',
      cmd: 'rhx clone whoami --output json',
    },
  },
  killed: {
    live: 'unknown — the clone probe was terminated',
    why: [
      '`clone whoami` died by a signal rather than an exit code',
      `this is NOT the ${CAP_SECONDS} cap — the cap reports \`timed-out\` and settles first`,
      'another party ended the probe: an oom killer, a ci runner cap, or a supervisor',
    ],
    fix: {
      says: 'run the probe by hand, then read what ended the last one',
      cmd: 'rhx clone whoami --output json',
    },
  },
  'spawn-failed': {
    live: 'unknown — the switch was never submitted',
    why: [
      'the clone address WAS confirmed, and the `clone say` child never launched',
      'the usual cause is an absent `node_modules/.bin/rhx` binary',
    ],
    fix: {
      says: 'restore the local binaries, then re-enter the stone',
      cmd: 'npm ci',
    },
  },
};

/**
 * .what = every halt cause, as a VALUE a test can walk
 * .why = derived from `HALTS`, a `Record<StoneBrainHaltCause, …>` the compiler refuses to leave
 *        incomplete, so a new cause reaches every consumer with no edit. a hand-written list
 *        once stayed green while a seventh cause shipped unrendered
 */
export const STONE_BRAIN_HALT_CAUSES = Object.keys(
  HALTS,
) as StoneBrainHaltCause[];

/**
 * .what = the halt for a stone whose prescribed brain was never dispatched, as a BRANCH of
 *         the drive's own `🗿 route.drive` tree
 * .why = the wish's bound — "fail loud, never a silent no-op". a silent skip would let a stone
 *        run on the brain its guard was written to avoid (case=2)
 *
 * 🔴 .note = it returns tree LINES, never a standalone block. a halt that renders its own
 *           layout beside the drive's reads as a second speaker (`S13`); the caller splices
 *           it under the drive's header and `where do we go?` bucket, which already name the
 *           prescribed brain and effort
 * .note = `isLast` picks the elbow: `└─` when this is the tree's final branch, `├─` when a
 *         route halt follows it in the same tree. the continuation indent follows the elbow
 * .note = it does not name the live brain: no surface here can read it (F5)
 * .note = every remedy restores DISPATCHABILITY alone; the stone's own `brain:` supplies the
 *         model on the next entry
 */
export const formatStoneBrainUndispatched = (input: {
  guard: string;
  cause: StoneBrainHaltCause;
  isLast: boolean;
}): string[] => {
  const halt = HALTS[input.cause];
  const elbow = input.isLast ? '└─' : '├─';
  const indent = input.isLast ? '      ' : '   │  ';

  // one remedy = a label leaf, then its command on a child leaf
  const asRemedy = (remedy: {
    label: string;
    cmd: string;
    isLast: boolean;
  }): string[] => [
    `${indent}${remedy.isLast ? '└─' : '├─'} ${remedy.label}`,
    `${indent}${remedy.isLast ? '   ' : '│  '}└─ ${remedy.cmd}`,
  ];

  return [
    `   ${elbow} ✋ halted, brain switch could not land`,
    `${indent}├─ this driver runs = ${halt.live}`,
    `${indent}│`,
    `${indent}├─ why`,
    ...halt.why.map(
      (line, index) =>
        `${indent}│  ${index === halt.why.length - 1 ? '└─' : '├─'} ${line}`,
    ),
    `${indent}│`,
    ...asRemedy({
      label: `fix: ${halt.fix.says}`,
      cmd: halt.fix.cmd,
      isLast: false,
    }),
    `${indent}│`,
    // the second remedy, on `timed-out` alone (see `HALTS`)
    ...(halt.also
      ? [
          ...asRemedy({
            label: `and: ${halt.also.says}`,
            cmd: halt.also.cmd,
            isLast: false,
          }),
          `${indent}│`,
        ]
      : []),
    ...asRemedy({
      label:
        "or: remove `brain:` from the stone's guard, and inherit the brain deliberately",
      cmd: input.guard,
      isLast: true,
    }),
  ];
};
