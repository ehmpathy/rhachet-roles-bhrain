import * as fs from 'fs';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { computeProjectSlug } from '@src/domain.operations/transcript/computeProjectSlug';

import { asTokenProposal } from './asTokenProposal';
import { formatTokenSpendTree } from './formatTokenSpendTree';
import { getOneTokenSpendReport } from './getOneTokenSpendReport';

const uuidOne = '11111111-1111-4111-8111-111111111111';
const uuidTwo = '22222222-2222-4222-8222-222222222222';
const uuidTorn = '33333333-3333-4333-8333-333333333333';
const uuidDup = '55555555-5555-4555-8555-555555555555';
const uuidLive = '66666666-6666-4666-8666-666666666666';
const uuidCompact = '77777777-7777-4777-8777-777777777777';
const uuidEmpty = '88888888-8888-4888-8888-888888888888';
const uuidParent = '99999999-9999-4999-8999-999999999999';
const uuidUnbooted = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const uuidTornParent = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const uuidLiveParent = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const uuidOlder = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const uuidNewer = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const uuidCompactParent = 'abababab-abab-4bab-8bab-abababababab';

/**
 * .what = one assistant record with a usage block
 */
const genAssistant = (input: {
  requestId: string;
  cacheRead: number;
  cacheWrite: number;
  inputRaw: number;
  output: number;
  toolUse?: { id: string; command: string };
  isSidechain?: boolean;
}): object => ({
  type: 'assistant',
  isSidechain: input.isSidechain ?? false,
  requestId: input.requestId,
  message: {
    model: 'claude-opus-4-5-20251101',
    usage: {
      input_tokens: input.inputRaw,
      cache_read_input_tokens: input.cacheRead,
      cache_creation_input_tokens: input.cacheWrite,
      cache_creation: {
        ephemeral_5m_input_tokens: input.cacheWrite,
        ephemeral_1h_input_tokens: 0,
      },
      output_tokens: input.output,
    },
    content: input.toolUse
      ? [
          {
            type: 'tool_use',
            id: input.toolUse.id,
            name: 'Bash',
            input: { command: input.toolUse.command },
          },
        ]
      : [{ type: 'text', text: 'done' }],
  },
});

/**
 * .what = a small three-call session: boot, a test-log tool result, a reply
 */
const genSessionLines = (): object[] => [
  {
    type: 'attachment',
    attachment: {
      type: 'instructions',
      files: [{ path: '/repo/boot.md', content: 'x'.repeat(40_000) }],
    },
  },
  { type: 'user', message: { role: 'user', content: 'run the tests' } },
  genAssistant({
    requestId: 'req_1',
    cacheRead: 0,
    cacheWrite: 19_990,
    inputRaw: 10,
    output: 100,
    toolUse: { id: 'tool_1', command: 'rhx git.repo.test --what unit' },
  }),
  {
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool_1',
          content: 'y'.repeat(20_000),
        },
      ],
    },
  },
  genAssistant({
    requestId: 'req_2',
    cacheRead: 20_000,
    cacheWrite: 5_098,
    inputRaw: 2,
    output: 50,
  }),
  { type: 'user', message: { role: 'user', content: 'thanks' } },
  genAssistant({
    requestId: 'req_3',
    cacheRead: 25_100,
    cacheWrite: 60,
    inputRaw: 1,
    output: 10,
  }),
];

/**
 * .what = a session cut by a compaction: the context shrinks to the summary at call 3
 */
const genCompactedSessionLines = (): object[] => [
  ...genSessionLines(),
  { type: 'system', subtype: 'compact_boundary' },
  {
    type: 'user',
    isCompactSummary: true,
    message: { role: 'user', content: 'z'.repeat(4_000) },
  },
  genAssistant({
    requestId: 'req_4',
    cacheRead: 0,
    cacheWrite: 1_000,
    inputRaw: 5,
    output: 20,
  }),
];

/**
 * .what = a session that never got a metered reply
 */
const genUnmeteredSessionLines = (): object[] => [
  { type: 'user', message: { role: 'user', content: 'hello?' } },
];

/**
 * .what = a subagent's session: every record a sidechain, as claude writes it
 */
const genSubagentLines = (): object[] =>
  genSessionLines().map((line) => ({ ...line, isSidechain: true }));

/**
 * .what = a session whose boot instructions never reached the transcript
 */
const genUnbootedSessionLines = (): object[] => genSessionLines().slice(1);

const asJsonl = (lines: object[]): string =>
  `${lines.map((line) => JSON.stringify(line)).join('\n')}\n`;

describe('getOneTokenSpendReport', () => {
  const scene = useBeforeAll(async () => {
    const root = genTempDir({ slug: 'reflect-on-token-spend' });
    const configDir = path.join(root, 'claude-config');
    const projectDir = path.join(configDir, 'projects', '-repo-demo');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, `${uuidOne}.jsonl`),
      asJsonl(genSessionLines()),
    );
    fs.writeFileSync(
      path.join(projectDir, `${uuidTwo}.jsonl`),
      asJsonl(genSessionLines()),
    );
    const tornDir = path.join(root, 'torn');
    fs.mkdirSync(tornDir, { recursive: true });
    fs.writeFileSync(
      path.join(tornDir, `${uuidTorn}.jsonl`),
      '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );

    // a second project, so the case2 glob over the first sees only its two sessions
    const otherDir = path.join(configDir, 'projects', '-repo-other');
    fs.mkdirSync(otherDir, { recursive: true });

    // one uuid under both roots, to prove the lookup never picks one silently
    const homeProjectDir = path.join(
      root,
      'home',
      '.claude',
      'projects',
      '-repo-demo',
    );
    fs.mkdirSync(homeProjectDir, { recursive: true });
    fs.writeFileSync(
      path.join(otherDir, `${uuidDup}.jsonl`),
      asJsonl(genSessionLines()),
    );
    fs.writeFileSync(
      path.join(homeProjectDir, `${uuidDup}.jsonl`),
      asJsonl(genSessionLines()),
    );

    // a live session whose final line is half-written
    fs.writeFileSync(
      path.join(otherDir, `${uuidLive}.jsonl`),
      `${asJsonl(genSessionLines())}{"type":"assis`,
    );

    // a compacted session, and two sessions with no metered reply
    fs.writeFileSync(
      path.join(otherDir, `${uuidCompact}.jsonl`),
      asJsonl(genCompactedSessionLines()),
    );
    const emptyDir = path.join(root, 'empty');
    fs.mkdirSync(emptyDir, { recursive: true });
    fs.writeFileSync(
      path.join(emptyDir, `${uuidEmpty}.jsonl`),
      asJsonl(genUnmeteredSessionLines()),
    );
    fs.writeFileSync(
      path.join(emptyDir, `${uuidTwo}.jsonl`),
      asJsonl(genUnmeteredSessionLines()),
    );

    // a subagent file under its parent session's dir, and a session that never booted
    const subagentParentDir = path.join(root, 'sub', uuidParent);
    fs.mkdirSync(path.join(subagentParentDir, 'subagents'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(subagentParentDir, 'subagents', 'agent-a1.jsonl'),
      asJsonl(genSubagentLines()),
    );
    fs.writeFileSync(
      path.join(root, 'sub', `${uuidParent}.jsonl`),
      asJsonl(genSessionLines()),
    );

    // a parent session whose one subagent file is torn mid-file
    const tornSubagentParentDir = path.join(root, 'subtorn', uuidTornParent);
    fs.mkdirSync(path.join(tornSubagentParentDir, 'subagents'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, 'subtorn', `${uuidTornParent}.jsonl`),
      asJsonl(genSessionLines()),
    );
    fs.writeFileSync(
      path.join(tornSubagentParentDir, 'subagents', 'agent-b1.jsonl'),
      '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );

    // a compacted parent session whose one subagent was never compacted
    const compactParentDir = path.join(root, 'subcompact', uuidCompactParent);
    fs.mkdirSync(path.join(compactParentDir, 'subagents'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, 'subcompact', `${uuidCompactParent}.jsonl`),
      asJsonl(genCompactedSessionLines()),
    );
    fs.writeFileSync(
      path.join(compactParentDir, 'subagents', 'agent-d1.jsonl'),
      asJsonl(genSubagentLines()),
    );

    const unbootedDir = path.join(root, 'unbooted');
    fs.mkdirSync(unbootedDir, { recursive: true });
    fs.writeFileSync(
      path.join(unbootedDir, `${uuidUnbooted}.jsonl`),
      asJsonl(genUnbootedSessionLines()),
    );

    // a parent session whose one subagent is still live, its last line half-written
    const liveSubagentParentDir = path.join(root, 'sublive', uuidLiveParent);
    fs.mkdirSync(path.join(liveSubagentParentDir, 'subagents'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, 'sublive', `${uuidLiveParent}.jsonl`),
      asJsonl(genSessionLines()),
    );
    fs.writeFileSync(
      path.join(liveSubagentParentDir, 'subagents', 'agent-c1.jsonl'),
      `${asJsonl(genSubagentLines())}{"type":"assis`,
    );

    // a corpus where one file is torn and one is unmetered, so neither can be read
    const mixedSkipDir = path.join(root, 'mixedskip');
    fs.mkdirSync(mixedSkipDir, { recursive: true });
    fs.writeFileSync(
      path.join(mixedSkipDir, `${uuidTorn}.jsonl`),
      '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );
    fs.writeFileSync(
      path.join(mixedSkipDir, `${uuidEmpty}.jsonl`),
      asJsonl(genUnmeteredSessionLines()),
    );

    // a project dir for a cwd with two sessions, the newer one by mtime
    const mtimeCwd = path.join(root, 'mtime-cwd');
    fs.mkdirSync(mtimeCwd, { recursive: true });
    const mtimeProjectDir = path.join(
      configDir,
      'projects',
      computeProjectSlug({ cwd: mtimeCwd }),
    );
    fs.mkdirSync(mtimeProjectDir, { recursive: true });
    fs.writeFileSync(
      path.join(mtimeProjectDir, `${uuidOlder}.jsonl`),
      asJsonl(genSessionLines()),
    );
    fs.writeFileSync(
      path.join(mtimeProjectDir, `${uuidNewer}.jsonl`),
      asJsonl(genSessionLines()),
    );
    fs.utimesSync(
      path.join(mtimeProjectDir, `${uuidOlder}.jsonl`),
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-01T00:00:00Z'),
    );
    fs.utimesSync(
      path.join(mtimeProjectDir, `${uuidNewer}.jsonl`),
      new Date('2026-02-01T00:00:00Z'),
      new Date('2026-02-01T00:00:00Z'),
    );

    // a project dir for a cwd with two sessions of one equal mtime
    const tieCwd = path.join(root, 'tie-cwd');
    fs.mkdirSync(tieCwd, { recursive: true });
    const tieProjectDir = path.join(
      configDir,
      'projects',
      computeProjectSlug({ cwd: tieCwd }),
    );
    fs.mkdirSync(tieProjectDir, { recursive: true });
    [uuidNewer, uuidOlder].forEach((uuid) => {
      const file = path.join(tieProjectDir, `${uuid}.jsonl`);
      fs.writeFileSync(file, asJsonl(genSessionLines()));
      fs.utimesSync(
        file,
        new Date('2026-03-01T00:00:00Z'),
        new Date('2026-03-01T00:00:00Z'),
      );
    });

    const env = {
      CLAUDE_CONFIG_DIR: configDir,
      CLAUDE_CODE_SESSION_ID: null,
      HOME: path.join(root, 'home'),
    };
    return {
      tieCwd,
      tieProjectDir,
      mixedSkipDir,
      mtimeCwd,
      mtimeProjectDir,
      root,
      projectDir,
      otherDir,
      tornDir,
      emptyDir,
      subagentParentDir,
      tornSubagentParentDir,
      unbootedDir,
      env,
    };
  });

  given('[case1] one transcript named by session uuid', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [uuidOne],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the transcript is found under $CLAUDE_CONFIG_DIR', () => {
        expect(report.transcripts).toEqual([
          {
            path: path.join(scene.projectDir, `${uuidOne}.jsonl`),
            chosenBy: 'uuid',
            subagentOf: null,
          },
        ]);
      });

      then('a session that booted its instructions carries no note', () => {
        expect(report.notes).toEqual([]);
      });

      then('efficiency sums the measured usage of every call', () => {
        expect(report.calls).toEqual(3);
        expect(report.efficiency.cacheRead).toEqual(45_100);
        expect(report.efficiency.cacheWrite5m).toEqual(25_148);
        expect(report.efficiency.output).toEqual(160);
      });

      then('the inventory sums to the last call context', () => {
        const total = report.inventory.reduce(
          (sum, row) => sum + row.tokens,
          0,
        );
        expect(total).toEqual(25_161);
      });

      then('the test log is labeled by its skill', () => {
        const toolRow = report.inventory.find(
          (row) => row.category === 'tool.result',
        );
        expect(toolRow?.labels.map((entry) => entry.label)).toEqual([
          'Bash · git.repo.test',
        ]);
      });

      then('the treestruct render matches the snapshot', () => {
        const stdout = formatTokenSpendTree({
          report: {
            ...report,
            transcripts: [
              { path: '<transcript>', chosenBy: 'uuid', subagentOf: null },
            ],
          },
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain('🌕 reflect.on.token.spend');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a glob over two transcripts', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [path.join(scene.projectDir, '*.jsonl')],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('both are read and summed as a corpus', () => {
        expect(report.transcripts).toHaveLength(2);
        expect(report.calls).toEqual(6);
        expect(report.efficiency.cacheRead).toEqual(90_200);
      });
    });
  });

  given('[case3] a corpus with one torn transcript', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [
            path.join(scene.projectDir, `${uuidOne}.jsonl`),
            path.join(scene.tornDir, `${uuidTorn}.jsonl`),
          ],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the torn file is skipped and named, never dropped', () => {
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0]!.kind).toEqual('malformed');
        expect(report.skipped[0]!.reason).toContain('malformed');
        expect(report.calls).toEqual(3);
      });

      then('the skip names the torn line, so a human can open it there', () => {
        expect(report.skipped[0]!.line).toEqual('2 of 3');
        const stdout = formatTokenSpendTree({
          report,
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain(`${uuidTorn}.jsonl @ line 2 of 3`);
      });
    });
  });

  given('[case4] a torn transcript read alone', () => {
    when('[t0] the report is computed', () => {
      then('it fails loud as a malfunction', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: [path.join(scene.tornDir, `${uuidTorn}.jsonl`)],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
      });
    });
  });

  given('[case5] a uuid no root holds', () => {
    when('[t0] the report is computed', () => {
      then('it fails as a constraint that names where it looked', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: ['44444444-4444-4444-8444-444444444444'],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('transcript not found');
        expect(error.message).toContain('claude-config');
      });
    });
  });

  given('[case6] a transcript with no metered call, read alone', () => {
    when('[t0] the report is computed', () => {
      // the error rides inside an object: the shared handle is a proxy, which would
      // hide an Error's class and its non-enumerable message
      const result = useThen('it fails', async () => ({
        error: await getError(
          getOneTokenSpendReport({
            selectors: [path.join(scene.emptyDir, `${uuidEmpty}.jsonl`)],
            cwd: scene.root,
            env: scene.env,
          }),
        ),
      }));

      then('it fails as a constraint, never a report of zeros', () => {
        expect(result.error).toBeInstanceOf(BadRequestError);
        expect(result.error.message).toContain(
          'transcript holds no metered calls',
        );
      });

      then(
        'it counts the records, says why, and names two runnable fixes',
        () => {
          const error = result.error;
          expect(error.message).toContain(
            '1 (0 assistant records with message.usage)',
          );
          expect(error.message).toContain('"why"');
          expect(error.message).toContain(
            'rhx reflect.on.token.spend --from <path-to-another.jsonl>',
          );
          expect(error.message).toContain(`${scene.emptyDir}/*.jsonl`);
        },
      );
    });
  });

  given('[case7] a corpus with one unmetered transcript', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [
            path.join(scene.projectDir, `${uuidOne}.jsonl`),
            path.join(scene.emptyDir, `${uuidEmpty}.jsonl`),
          ],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the unmetered file is skipped under its own bucket', () => {
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0]!.kind).toEqual('unmetered');
        expect(report.calls).toEqual(3);
      });

      then('the render names the bucket', () => {
        const stdout = formatTokenSpendTree({
          report,
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain('skipped (1)');
        expect(stdout).toContain('unmetered (1)');
      });
    });
  });

  given('[case8] a corpus where every transcript is unmetered', () => {
    when('[t0] the report is computed', () => {
      then('it fails as a constraint that names each skip', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: [path.join(scene.emptyDir, '*.jsonl')],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('no transcript could be read');
        expect(error.message).toContain(uuidEmpty);
      });
    });
  });

  given('[case9] a uuid present under both roots', () => {
    when('[t0] the report is computed', () => {
      then(
        'it fails as a constraint and lists both, never picks one',
        async () => {
          const error = await getError(
            getOneTokenSpendReport({
              selectors: [uuidDup],
              cwd: scene.root,
              env: scene.env,
            }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('transcript uuid is ambiguous');
          expect(error.message).toContain('claude-config');
          expect(error.message).toContain('.claude/projects');
        },
      );
    });
  });

  given('[case10] @current in a live session with a half-written tail', () => {
    when('[t0] the report is computed with no --from', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [],
          cwd: scene.root,
          env: { ...scene.env, CLAUDE_CODE_SESSION_ID: uuidLive },
        }),
      );

      then('the session id chose the transcript', () => {
        expect(report.transcripts).toEqual([
          {
            path: path.join(scene.otherDir, `${uuidLive}.jsonl`),
            chosenBy: 'session-id',
            subagentOf: null,
          },
        ]);
      });

      then(
        'the half-written tail is skipped and counted, never a fault',
        () => {
          expect(report.partialLinesSkipped).toEqual(1);
          expect(report.calls).toEqual(3);
        },
      );
    });
  });

  given('[case11] a transcript cut by a compaction', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [uuidCompact],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the context re-bases at the call after the cut', () => {
        expect(
          report.rebases.map((rebase) => ({
            call: rebase.call,
            cause: rebase.cause,
          })),
        ).toEqual([{ call: 4, cause: 'compaction' }]);
      });

      then('the summary is held, labeled as the compaction summary', () => {
        const labels = report.inventory.flatMap((row) =>
          row.labels.map((entry) => entry.label),
        );
        expect(labels).toContain('compaction.summary');
      });

      then('the render names the rebase', () => {
        const stdout = formatTokenSpendTree({
          report: {
            ...report,
            transcripts: [
              { path: '<transcript>', chosenBy: 'uuid', subagentOf: null },
            ],
          },
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain('rebases = 1');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case12] a path that does not exist', () => {
    when('[t0] the report is computed', () => {
      then('it fails as a constraint that names the path', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: ['absent/session.jsonl'],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('transcript not found');
        expect(error.message).toContain('absent/session.jsonl');
      });
    });
  });

  given(
    '[case13] @current with no session id, in a dir with no transcript',
    () => {
      when('[t0] the report is computed', () => {
        then('it fails as a constraint that names the dir', async () => {
          const error = await getError(
            getOneTokenSpendReport({
              selectors: ['@current'],
              cwd: path.join(scene.root, 'no-such-project'),
              env: scene.env,
            }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('no transcript for this directory');
        });
      });
    },
  );

  given('[case14] a subagent transcript passed by its own path', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [
            path.join(scene.subagentParentDir, 'subagents', 'agent-a1.jsonl'),
          ],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('its sidechain records are read as its own calls', () => {
        expect(report.calls).toEqual(3);
      });

      then('the header names the session it belongs to', () => {
        expect(report.transcripts[0]!.subagentOf).toEqual(uuidParent);
        const stdout = formatTokenSpendTree({
          report,
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain(`subagent of = ${uuidParent}`);
      });
    });
  });

  given('[case15] a glob that matches no file', () => {
    when('[t0] the report is computed', () => {
      then('it fails as a constraint that names the glob', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: [path.join(scene.emptyDir, 'nope-*.jsonl')],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('transcript glob matched no file');
        expect(error.message).toContain('nope-*.jsonl');
      });
    });
  });

  given('[case16] a uuid looked up with $CLAUDE_CONFIG_DIR unset', () => {
    when('[t0] the report is computed', () => {
      then(
        'the halt names the unset root beside the ones it read',
        async () => {
          const error = await getError(
            getOneTokenSpendReport({
              selectors: ['44444444-4444-4444-8444-444444444444'],
              cwd: scene.root,
              env: { ...scene.env, CLAUDE_CONFIG_DIR: null },
            }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain(
            '$CLAUDE_CONFIG_DIR/projects (unset)',
          );
          expect(error.message).toContain('.claude/projects');
        },
      );
    });
  });

  given('[case17] a session that never booted its instructions', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [path.join(scene.unbootedDir, `${uuidUnbooted}.jsonl`)],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the inventory notes where the boot share sits', () => {
        expect(report.notes).toEqual([
          'no boot.instructions block was seen; the boot share sits inside unattributed',
        ]);
        const stdout = formatTokenSpendTree({
          report,
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain('note: no boot.instructions block was seen');
      });
    });
  });

  given('[case18] a main transcript with a subagent beside it', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [path.join(scene.root, 'sub', `${uuidParent}.jsonl`)],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then(
        'the subagent is read as its own row, never folded into the main thread',
        () => {
          expect(report.calls).toEqual(3);
          expect(report.subagents).toHaveLength(1);
          expect(report.subagents[0]!.path).toEqual(
            path.join(scene.subagentParentDir, 'subagents', 'agent-a1.jsonl'),
          );
          expect(report.subagents[0]!.calls).toEqual(3);
        },
      );

      then('the render shows the subagent row', () => {
        const stdout = formatTokenSpendTree({
          report: {
            ...report,
            transcripts: [
              { path: '<transcript>', chosenBy: 'path', subagentOf: null },
            ],
            subagents: report.subagents.map((subagent) => ({
              ...subagent,
              path: '<subagent>',
            })),
          },
          proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
        });
        expect(stdout).toContain('subagents (1, their own spend)');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case27] a compacted parent with a subagent beside it', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [
            path.join(scene.root, 'subcompact', `${uuidCompactParent}.jsonl`),
          ],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the parent re-bases at its own compaction, as if alone', () => {
        expect(
          report.rebases.map((rebase) => ({
            call: rebase.call,
            cause: rebase.cause,
          })),
        ).toEqual([{ call: 4, cause: 'compaction' }]);
      });

      then('the subagent keeps its own calls, untouched by the cut', () => {
        expect(report.calls).toEqual(4);
        expect(report.subagents).toHaveLength(1);
        expect(report.subagents[0]!.calls).toEqual(3);
      });

      // the same subagent lines, under a parent that was never compacted
      const reportUncut = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [path.join(scene.root, 'sub', `${uuidParent}.jsonl`)],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the subagent spend equals its spend under an uncut parent', () => {
        expect({
          calls: report.subagents[0]!.calls,
          tokens: report.subagents[0]!.tokens,
          priced: report.subagents[0]!.priced,
        }).toEqual({
          calls: reportUncut.subagents[0]!.calls,
          tokens: reportUncut.subagents[0]!.tokens,
          priced: reportUncut.subagents[0]!.priced,
        });
      });
    });
  });

  given('[case19] a corpus where one parent holds a torn subagent', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [
            path.join(scene.projectDir, `${uuidOne}.jsonl`),
            path.join(scene.root, 'subtorn', `${uuidTornParent}.jsonl`),
          ],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('the skip names the torn subagent file, never its parent', () => {
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0]!.kind).toEqual('malformed');
        expect(report.skipped[0]!.path).toEqual(
          path.join(scene.tornSubagentParentDir, 'subagents', 'agent-b1.jsonl'),
        );
        expect(report.skipped[0]!.line).toEqual('2 of 3');
      });
    });
  });

  given(
    '[case20] a parent whose subagent is live, its tail half-written',
    () => {
      when('[t0] the report is computed', () => {
        const report = useBeforeAll(async () =>
          getOneTokenSpendReport({
            selectors: [
              path.join(scene.root, 'sublive', `${uuidLiveParent}.jsonl`),
            ],
            cwd: scene.root,
            env: scene.env,
          }),
        );

        then('the subagent tail is counted with the parent tail', () => {
          expect(report.partialLinesSkipped).toEqual(1);
          expect(report.subagents).toHaveLength(1);
          expect(report.subagents[0]!.calls).toEqual(3);
        });
      });
    },
  );

  given('[case21] a corpus where one file is torn and one is unmetered', () => {
    when('[t0] the report is computed', () => {
      then('the halt names both fixes, never only the repoint', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: [path.join(scene.mixedSkipDir, '*.jsonl')],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('no transcript could be read');
        expect(error.message).toContain(
          're-copy each malformed file from its source, and point past each unmetered one',
        );
        expect(error.message).toContain(
          '"matched": "2 · metered = 0 · skipped = 2"',
        );
      });
    });
  });

  given(
    '[case22] two selectors, one that matches and one that matches none',
    () => {
      when('[t0] the report is computed', () => {
        then('it halts on the dead selector, never drops it', async () => {
          const error = await getError(
            getOneTokenSpendReport({
              selectors: [
                path.join(scene.projectDir, `${uuidOne}.jsonl`),
                path.join(scene.emptyDir, 'nope-*.jsonl'),
              ],
              cwd: scene.root,
              env: scene.env,
            }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('transcript glob matched no file');
          expect(error.message).toContain('nope-*.jsonl');
        });
      });
    },
  );

  given(
    '[case23] @current with no session id, in a dir with two sessions',
    () => {
      when('[t0] the report is computed', () => {
        const report = useBeforeAll(async () =>
          getOneTokenSpendReport({
            selectors: ['@current'],
            cwd: scene.mtimeCwd,
            env: scene.env,
          }),
        );

        then('the newest transcript by mtime is chosen, and says so', () => {
          expect(report.transcripts).toEqual([
            {
              path: path.join(scene.mtimeProjectDir, `${uuidNewer}.jsonl`),
              chosenBy: 'mtime',
              subagentOf: null,
            },
          ]);
          const stdout = formatTokenSpendTree({
            report,
            proposal: asTokenProposal({ repaid: report.repaid, limit: 3 }),
          });
          expect(stdout).toContain('chosen by = mtime');
        });
      });
    },
  );

  given(
    '[case24] @current with no session id, two sessions of one equal mtime',
    () => {
      when('[t0] the report is computed', () => {
        const report = useBeforeAll(async () =>
          getOneTokenSpendReport({
            selectors: ['@current'],
            cwd: scene.tieCwd,
            env: scene.env,
          }),
        );

        then('the tie falls to the path, so the pick never varies', () => {
          expect(report.transcripts).toHaveLength(1);
        });

        then('the lexically first path is the one chosen', () => {
          expect(report.transcripts).toEqual([
            {
              path: path.join(scene.tieProjectDir, `${uuidOlder}.jsonl`),
              chosenBy: 'mtime',
              subagentOf: null,
            },
          ]);
        });
      });
    },
  );

  given('[case25] a glob that matches exactly one torn file', () => {
    when('[t0] the report is computed', () => {
      then(
        'the glob reads as a corpus: the file is skipped and named, then the corpus halts',
        async () => {
          const error = await getError(
            getOneTokenSpendReport({
              selectors: [path.join(scene.tornDir, '*.jsonl')],
              cwd: scene.root,
              env: scene.env,
            }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain('no transcript could be read');
          expect(error.message).toContain(
            '"matched": "1 · metered = 0 · skipped = 1"',
          );
        },
      );
    });
  });

  given('[case26] one parent read alone, whose subagent file is torn', () => {
    when('[t0] the report is computed', () => {
      then(
        'it fails loud as a malfunction, and names the subagent file and line',
        async () => {
          const error = await getError(
            getOneTokenSpendReport({
              selectors: [
                path.join(scene.root, 'subtorn', `${uuidTornParent}.jsonl`),
              ],
              cwd: scene.root,
              env: scene.env,
            }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain(
            path.join(
              scene.tornSubagentParentDir,
              'subagents',
              'agent-b1.jsonl',
            ),
          );
          expect(error.message).toContain('2 of 3');
        },
      );
    });
  });

  given('[case28] a path, then a glob that also matches it', () => {
    when('[t0] the report is computed', () => {
      const report = useBeforeAll(async () =>
        getOneTokenSpendReport({
          selectors: [
            path.join(scene.projectDir, `${uuidOne}.jsonl`),
            path.join(scene.projectDir, '*.jsonl'),
          ],
          cwd: scene.root,
          env: scene.env,
        }),
      );

      then('each path is read once', () => {
        expect(report.transcripts).toHaveLength(2);
        expect(report.calls).toEqual(6);
      });

      then('the first selector that named a path decides its chosen-by', () => {
        expect(report.transcripts).toEqual([
          {
            path: path.join(scene.projectDir, `${uuidOne}.jsonl`),
            chosenBy: 'path',
            subagentOf: null,
          },
          {
            path: path.join(scene.projectDir, `${uuidTwo}.jsonl`),
            chosenBy: 'glob',
            subagentOf: null,
          },
        ]);
      });
    });
  });

  given('[case29] a path that names a directory', () => {
    when('[t0] the report is computed', () => {
      then('it fails as a constraint, never as a raw EISDIR', async () => {
        const error = await getError(
          getOneTokenSpendReport({
            selectors: [scene.projectDir],
            cwd: scene.root,
            env: scene.env,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('transcript path is a directory');
        expect(error.message).not.toContain('EISDIR');
      });
    });
  });
});
