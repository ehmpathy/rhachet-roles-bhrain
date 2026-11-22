import { asRouteReminderLegacyReapLines } from './asRouteReminderLegacyReapLines';
import type { RouteReminderLegacyReapOutcome } from './delRouteReminderLegacyHandles';
import { RouteReminderPidMalformedError } from './RouteReminderPidMalformedError';

const PID_PATH = '/repo/.behavior/v1.old/.route/x.pid';

const TEST_CASES: {
  description: string;
  outcome: RouteReminderLegacyReapOutcome;
  expect: { contains: string[]; excludes: string[] };
}[] = [
  {
    description: 'an absent handle renders no line',
    outcome: { kind: 'absent' },
    expect: { contains: [], excludes: [] },
  },
  {
    description: 'a live daemon signalled reads as reaped',
    outcome: { kind: 'reaped', pid: 41, pidPath: PID_PATH, signalled: true },
    expect: {
      contains: ['legacy daemon reaped — pid 41'],
      excludes: ['already gone'],
    },
  },
  {
    description: 'a stale file reads as cleared, never as a stopped daemon',
    outcome: { kind: 'reaped', pid: 41, pidPath: PID_PATH, signalled: false },
    expect: {
      contains: ['legacy handle cleared — pid 41 was already gone'],
      excludes: ['daemon reaped'],
    },
  },
  {
    description: 'an EPERM fault says never signal the recycled pid',
    outcome: {
      kind: 'kept',
      pid: 41,
      pidPath: PID_PATH,
      error: Object.assign(new Error('kill EPERM'), { code: 'EPERM' }),
    },
    expect: {
      contains: [
        'the signal to pid 41 was refused (EPERM)',
        'pid 41 was recycled to a foreign process, so do not signal it',
        `remove ${PID_PATH}`,
      ],
      excludes: ['kill 41', 'kill EPERM'],
    },
  },
  {
    description: 'a torn file names no pid to stop, and no json dump',
    outcome: {
      kind: 'kept',
      pid: null,
      pidPath: PID_PATH,
      error: new RouteReminderPidMalformedError(
        'RouteReminder pid file is malformed',
        { pidPath: PID_PATH, raw: '12x' },
      ),
    },
    expect: {
      contains: [
        'the pid file is torn',
        'the file names no pid',
        `remove ${PID_PATH}`,
      ],
      excludes: [
        'kill',
        '"raw"',
        'RouteReminderPidMalformedError',
        'malformed',
      ],
    },
  },
  {
    description: 'another fault on a readable pid says to stop it by hand',
    outcome: {
      kind: 'kept',
      pid: 41,
      pidPath: PID_PATH,
      error: Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      }),
    },
    expect: {
      contains: [
        'the reap of pid 41 faulted (EACCES)',
        'stop pid 41 by hand (kill 41)',
        `remove ${PID_PATH}`,
      ],
      excludes: ['permission denied'],
    },
  },
  {
    description:
      'a fault with no errno names its message, its class prefix cut',
    outcome: {
      kind: 'kept',
      pid: 41,
      pidPath: PID_PATH,
      error: new Error('BadRequestError: the handle moved\n{"pid":41}'),
    },
    expect: {
      contains: ['the reap of pid 41 faulted: the handle moved'],
      excludes: ['BadRequestError', '{"pid"'],
    },
  },
];

describe('asRouteReminderLegacyReapLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const lines = asRouteReminderLegacyReapLines({
        outcomes: [thisCase.outcome],
      });
      const out = lines.join('\n');
      if (thisCase.outcome.kind === 'absent') expect(lines).toEqual([]);
      for (const part of thisCase.expect.contains) expect(out).toContain(part);
      for (const part of thisCase.expect.excludes)
        expect(out).not.toContain(part);
      expect(lines).toMatchSnapshot();
    }),
  );
});
