import { asAllManifestHookSites } from './asAllManifestHookSites';

/**
 * .what = one manifest data row, in rhachet's declared field order
 * .why = event, matcher, timeout, author, kind, path, frame, args, command, when — joined by
 *        `\x1f`, the args packed by `\x1e`, exactly as `rhx init --hooks` writes them
 */
const asRow = (input: {
  event: string;
  timeout: string;
  author: string;
  args: string[];
  command: string;
  when: string;
}): string =>
  [
    input.event,
    '*',
    input.timeout,
    input.author,
    'rhx-skill',
    '.agent/skills/x.sh',
    '🪨 run solid skill',
    input.args.join('\x1e'),
    input.command,
    input.when,
  ].join('\x1f');

const TEST_CASES = [
  {
    description: 'a row with no `when` reads its command',
    given: {
      manifest: asRow({
        event: 'Stop',
        timeout: '25',
        author: 'repo=bhrain/role=driver',
        args: ['--skill', 'route.drive', '--when', 'hook.onStop'],
        command: './node_modules/.bin/rhx route.drive --when hook.onStop',
        when: '',
      }),
    },
    expect: {
      sites: [
        {
          command: './node_modules/.bin/rhx route.drive --when hook.onStop',
          timeoutSeconds: 25,
          author: 'repo=bhrain/role=driver',
        },
      ],
    },
  },
  {
    description: 'a row whose `when` is set still reads its command, never the `when`',
    given: {
      manifest: asRow({
        event: 'PreToolUse',
        timeout: '5',
        author: 'repo=bhrain/role=learner',
        args: ['--skill', 'memory.guard', '--mode', 'hook'],
        command: './node_modules/.bin/rhx memory.guard --mode hook',
        when: 'before',
      }),
    },
    expect: {
      sites: [
        {
          command: './node_modules/.bin/rhx memory.guard --mode hook',
          timeoutSeconds: 5,
          author: 'repo=bhrain/role=learner',
        },
      ],
    },
  },
  {
    description: 'a `#` line and a blank line are skipped',
    given: {
      manifest: [
        '# rhachet hooks.dispatch manifest v1',
        '# Stop · * · 25s · repo=bhrain/role=driver · ./node_modules/.bin/rhx route.drive',
        '',
      ].join('\n'),
    },
    expect: { sites: [] },
  },
];

describe('asAllManifestHookSites', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asAllManifestHookSites(thisCase.given)).toEqual(
        thisCase.expect.sites,
      );
    }),
  );
});
