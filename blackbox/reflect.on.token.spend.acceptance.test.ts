import * as fs from 'fs';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

const uuidOne = '11111111-1111-4111-8111-111111111111';
const uuidTwo = '22222222-2222-4222-8222-222222222222';
const uuidTorn = '33333333-3333-4333-8333-333333333333';
const uuidAbsent = '44444444-4444-4444-8444-444444444444';
const uuidTornTwo = '55555555-5555-4555-8555-555555555555';
const uuidUnmetered = '88888888-8888-4888-8888-888888888888';
const uuidUnmeteredTwo = '99999999-9999-4999-8999-999999999999';
const uuidCompact = '77777777-7777-4777-8777-777777777777';
const uuidParent = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const uuidUnbooted = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const uuidMixedMetered = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const uuidMixedUnmetered = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const uuidLive = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const uuidUnpriced = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const uuidCompactParent = '12121212-1212-4212-8212-121212121212';
const uuidTornParent = '34343434-3434-4434-8434-343434343434';

/**
 * .what = one assistant record with a usage block
 */
const genAssistant = (input: {
  requestId: string;
  cacheRead: number;
  cacheWrite: number;
  inputRaw: number;
  output: number;
  command: string | null;
}): object => ({
  type: 'assistant',
  isSidechain: false,
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
    content: input.command
      ? [
          {
            type: 'tool_use',
            id: `tool_${input.requestId}`,
            name: 'Bash',
            input: { command: input.command },
          },
        ]
      : [{ type: 'text', text: 'done' }],
  },
});

/**
 * .what = a three-call session: boot, a test-log tool result, a reply
 */
const genSessionJsonl = (): string =>
  `${[
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
      command: 'rhx git.repo.test --what unit',
    }),
    {
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_req_1',
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
      command: null,
    }),
    { type: 'user', message: { role: 'user', content: 'thanks' } },
    genAssistant({
      requestId: 'req_3',
      cacheRead: 25_100,
      cacheWrite: 60,
      inputRaw: 1,
      output: 10,
      command: null,
    }),
  ]
    .map((line) => JSON.stringify(line))
    .join('\n')}\n`;

/**
 * .what = the session's records as objects, so a variant can reshape them
 */
const genSessionRecords = (): Record<string, unknown>[] =>
  genSessionJsonl()
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));

const asJsonl = (records: object[]): string =>
  `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;

/**
 * .what = the session, then a compaction that shrinks the context to its summary at call 4
 */
const genCompactedSessionJsonl = (): string =>
  asJsonl([
    ...genSessionRecords(),
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
      command: null,
    }),
  ]);

/**
 * .what = the session as a subagent writes it: every record a sidechain
 */
const genSubagentJsonl = (): string =>
  asJsonl(
    genSessionRecords().map((record) => ({ ...record, isSidechain: true })),
  );

/**
 * .what = the session with its boot instructions absent
 */
const genUnbootedSessionJsonl = (): string =>
  asJsonl(genSessionRecords().slice(1));

describe('reflect.on.token.spend', () => {
  const scene = useBeforeAll(async () => {
    // a repo with the reflector role linked
    const tempDir = genTempDirForReflector({
      slug: 'reflect-on-token-spend',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role reflector', {
      cwd: tempDir,
    });

    // a claude config dir with two sessions, plus a torn transcript beside it
    const configDir = path.join(tempDir, '.claude-config');
    const projectDir = path.join(configDir, 'projects', '-repo-demo');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, `${uuidOne}.jsonl`), genSessionJsonl());
    fs.writeFileSync(path.join(projectDir, `${uuidTwo}.jsonl`), genSessionJsonl());
    const tornPath = path.join(tempDir, `${uuidTorn}.jsonl`);
    fs.writeFileSync(tornPath, '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n');
    const tornPathTwo = path.join(tempDir, `${uuidTornTwo}.jsonl`);
    fs.writeFileSync(
      tornPathTwo,
      '{"type":"user"}\n{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );

    // a session that never got a metered reply
    const unmeteredDir = path.join(tempDir, 'unmetered');
    fs.mkdirSync(unmeteredDir, { recursive: true });
    const unmeteredPath = path.join(unmeteredDir, `${uuidUnmetered}.jsonl`);
    fs.writeFileSync(
      unmeteredPath,
      `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'hello?' } })}\n`,
    );

    fs.writeFileSync(
      path.join(unmeteredDir, `${uuidUnmeteredTwo}.jsonl`),
      `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'anyone?' } })}\n`,
    );

    // a home dir whose `~/.claude/projects` also holds uuidOne, so a uuid lookup is ambiguous
    const homeDir = path.join(tempDir, 'home');
    const homeProjectDir = path.join(homeDir, '.claude', 'projects', '-repo-demo');
    fs.mkdirSync(homeProjectDir, { recursive: true });
    fs.writeFileSync(
      path.join(homeProjectDir, `${uuidOne}.jsonl`),
      genSessionJsonl(),
    );

    // a compacted session, a subagent under its parent session dir, and an unbooted session
    const variantsDir = path.join(tempDir, 'variants');
    fs.mkdirSync(path.join(variantsDir, uuidParent, 'subagents'), {
      recursive: true,
    });
    const compactedPath = path.join(variantsDir, `${uuidCompact}.jsonl`);
    fs.writeFileSync(compactedPath, genCompactedSessionJsonl());
    const subagentPath = path.join(
      variantsDir,
      uuidParent,
      'subagents',
      'agent-a1.jsonl',
    );
    fs.writeFileSync(subagentPath, genSubagentJsonl());
    const unbootedPath = path.join(variantsDir, `${uuidUnbooted}.jsonl`);
    fs.writeFileSync(unbootedPath, genUnbootedSessionJsonl());
    const parentPath = path.join(variantsDir, `${uuidParent}.jsonl`);
    fs.writeFileSync(parentPath, genSessionJsonl());

    // a compacted parent with a subagent beside it, and a parent whose subagent is torn
    fs.mkdirSync(path.join(variantsDir, uuidCompactParent, 'subagents'), {
      recursive: true,
    });
    const compactParentPath = path.join(
      variantsDir,
      `${uuidCompactParent}.jsonl`,
    );
    fs.writeFileSync(compactParentPath, genCompactedSessionJsonl());
    fs.writeFileSync(
      path.join(variantsDir, uuidCompactParent, 'subagents', 'agent-d1.jsonl'),
      genSubagentJsonl(),
    );
    fs.mkdirSync(path.join(variantsDir, uuidTornParent, 'subagents'), {
      recursive: true,
    });
    const tornParentPath = path.join(variantsDir, `${uuidTornParent}.jsonl`);
    fs.writeFileSync(tornParentPath, genSessionJsonl());
    fs.writeFileSync(
      path.join(variantsDir, uuidTornParent, 'subagents', 'agent-b1.jsonl'),
      '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );

    // a corpus of one metered session beside one that never got a metered reply
    const mixedDir = path.join(tempDir, 'mixed');
    fs.mkdirSync(mixedDir, { recursive: true });
    fs.writeFileSync(
      path.join(mixedDir, `${uuidMixedMetered}.jsonl`),
      genSessionJsonl(),
    );
    fs.writeFileSync(
      path.join(mixedDir, `${uuidMixedUnmetered}.jsonl`),
      `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'hello?' } })}\n`,
    );

    // a live session, still written: its last line is half-flushed
    const liveProjectDir = path.join(configDir, 'projects', '-repo-live');
    fs.mkdirSync(liveProjectDir, { recursive: true });
    fs.writeFileSync(
      path.join(liveProjectDir, `${uuidLive}.jsonl`),
      `${genSessionJsonl()}{"type":"assistant","mess`,
    );

    // a corpus where one file is torn and one is unmetered, so no file can be read
    const mixedSkipDir = path.join(tempDir, 'mixed-skip');
    fs.mkdirSync(mixedSkipDir, { recursive: true });
    fs.writeFileSync(
      path.join(mixedSkipDir, `${uuidTorn}.jsonl`),
      '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );
    fs.writeFileSync(
      path.join(mixedSkipDir, `${uuidUnmetered}.jsonl`),
      `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'hello?' } })}\n`,
    );

    // a session on a model no rate card names, so no figure can be priced
    const unpricedPath = path.join(tempDir, `${uuidUnpriced}.jsonl`);
    fs.writeFileSync(
      unpricedPath,
      genSessionJsonl()
        .split('claude-opus-4-5-20251101')
        .join('claude-mystery-1'),
    );

    // a corpus of one metered session, one torn, and one unmetered — read, with two skips
    const mixedReadDir = path.join(tempDir, 'mixed-read');
    fs.mkdirSync(mixedReadDir, { recursive: true });
    fs.writeFileSync(
      path.join(mixedReadDir, `${uuidMixedMetered}.jsonl`),
      genSessionJsonl(),
    );
    fs.writeFileSync(
      path.join(mixedReadDir, `${uuidTorn}.jsonl`),
      '{"type":"user"}\n{"type":"ass\n{"type":"user"}\n',
    );
    fs.writeFileSync(
      path.join(mixedReadDir, `${uuidUnmetered}.jsonl`),
      `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'hello?' } })}\n`,
    );

    // a second config dir whose project for this cwd holds two sessions of known mtime
    const mtimeConfigDir = path.join(tempDir, '.claude-config-mtime');
    const mtimeProjectDir = path.join(
      mtimeConfigDir,
      'projects',
      fs.realpathSync(tempDir).replace(/[/_.]/g, '-'),
    );
    fs.mkdirSync(mtimeProjectDir, { recursive: true });
    const olderPath = path.join(mtimeProjectDir, `${uuidOne}.jsonl`);
    const newerPath = path.join(mtimeProjectDir, `${uuidTwo}.jsonl`);
    fs.writeFileSync(olderPath, genSessionJsonl());
    fs.writeFileSync(newerPath, genSessionJsonl());
    fs.utimesSync(olderPath, new Date('2026-01-01'), new Date('2026-01-01'));
    fs.utimesSync(newerPath, new Date('2026-02-01'), new Date('2026-02-01'));

    const env = { CLAUDE_CONFIG_DIR: configDir };
    return {
      unpricedPath,
      mixedReadDir,
      mixedSkipDir,
      mtimeConfigDir,
      mixedDir,
      parentPath,
      compactParentPath,
      tornParentPath,
      compactedPath,
      subagentPath,
      unbootedPath,
      tempDir,
      projectDir,
      tornPath,
      tornPathTwo,
      unmeteredDir,
      unmeteredPath,
      homeDir,
      env,
    };
  });

  /**
   * .what = sanitize output for a snapshot, with the scene's temp dir and its slug named
   * .why = the temp dir sits under the repo, so its absolute path and the project slug
   *        claude code derives from it differ per machine
   * .note = the cwd a process sees is the temp dir's realpath, so the slug derives from it
   */
  const asSnap = (output: string): string =>
    sanitizeReflectOutputForSnapshot(
      output
        .split(fs.realpathSync(scene.tempDir).replace(/[/_.]/g, '-'))
        .join('[TEMP_SLUG]')
        .split(scene.tempDir)
        .join('[TEMP_DIR]'),
    );

  given('[case1] a transcript named by session uuid', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: uuidOne },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0', () => {
        expect(res.code).toEqual(0);
      });

      then('it reports the transcript found by uuid', () => {
        expect(res.stdout).toContain('🌕 reflect.on.token.spend');
        expect(res.stdout).toContain('chosen by = uuid');
        expect(res.stdout).toContain('calls = 3');
      });

      then('price is primary: the versioned opus spec prices the total', () => {
        expect(res.stdout).toContain('total price = $0.18');
      });

      then('the test log is labeled by its skill in the repaid section', () => {
        expect(res.stdout).toContain('tool.result · Bash · git.repo.test');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a glob over a project dir', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.projectDir, '*.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('both transcripts are summed as one corpus', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('calls = 6');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] --help', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { help: true },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('it prints usage with --from and an example', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('--from');
      });

      then('it says what each tag and rebase cause in the report means', () => {
        expect(res.stdout).toContain('[apportioned]');
        expect(res.stdout).toContain('[unattributed]');
        expect(res.stdout).toContain('shrink');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] a uuid no root holds', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: uuidAbsent },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, a constraint', () => {
        expect(res.code).toEqual(2);
      });

      then('stderr names the class and where it looked', () => {
        expect(res.stderr).toContain('✋ ConstraintError:');
        expect(res.stderr).toContain('transcript not found');
        expect(res.stderr).toContain('.claude-config');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case5] a torn transcript read alone', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.tornPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 1, a malfunction', () => {
        expect(res.code).toEqual(1);
      });

      then('stderr names the class and the torn line', () => {
        expect(res.stderr).toContain('💥 MalfunctionError:');
        expect(res.stderr).toContain('malformed transcript line');
        expect(res.stderr).toContain('line = 2 of 3');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] a torn transcript inside a corpus', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: {
            from: [path.join(scene.projectDir, `${uuidOne}.jsonl`), scene.tornPath],
          },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('the torn file is skipped and named, the rest reported', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('skipped');
        expect(res.stdout).toContain('calls = 3');
      });

      then('the skip names the torn line', () => {
        expect(res.stdout).toContain(`${uuidTorn}.jsonl @ line 2 of 3`);
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case7] a transcript with no metered call, read alone', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.unmeteredPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, a constraint', () => {
        expect(res.code).toEqual(2);
      });

      then('stderr counts the records, says why, and names two runnable fixes', () => {
        expect(res.stderr).toContain('transcript holds no metered calls');
        expect(res.stderr).toContain(
          'records = 1 (0 assistant records with message.usage)',
        );
        expect(res.stderr).toContain('why:');
        expect(res.stderr).toContain('fix:');
        expect(res.stderr).toContain(
          'rhx reflect.on.token.spend --from <path-to-another.jsonl>',
        );
        expect(res.stderr).toContain('or:');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case8] a corpus where every transcript is torn', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: [scene.tornPath, scene.tornPathTwo] },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 1, a malfunction', () => {
        expect(res.code).toEqual(1);
      });

      then('stderr names each torn file at its line', () => {
        expect(res.stderr).toContain('no transcript could be read');
        expect(res.stderr).toContain(`${uuidTorn}.jsonl @ line 2 of 3`);
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case9] a mistyped flag', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { form: uuidOne },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, and @current is never read in its place', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('unrecognized flag(s)');
        expect(res.stderr).toContain('--form');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case10] a uuid looked up with $CLAUDE_CONFIG_DIR unset', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: uuidAbsent },
          cwd: scene.tempDir,
          env: { CLAUDE_CONFIG_DIR: '', HOME: scene.tempDir },
        }),
      );

      then('exit code is 2, and the halt names the unset root', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('$CLAUDE_CONFIG_DIR/projects (unset)');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case11] a path that names no file', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.tempDir, 'nope', 'absent.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, and the halt names the path', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('✋ ConstraintError:');
        expect(res.stderr).toContain('transcript not found');
        expect(res.stderr).toContain('absent.jsonl');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case12] a uuid held under both roots', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: uuidOne },
          cwd: scene.tempDir,
          env: { ...scene.env, HOME: scene.homeDir },
        }),
      );

      then('exit code is 2, and the halt lists both matches', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('transcript uuid is ambiguous');
        expect(res.stderr).toContain('.claude-config');
        expect(res.stderr).toContain(path.join('home', '.claude'));
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case13] @current where this directory has no transcript', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: {},
          cwd: scene.tempDir,
          env: {
            ...scene.env,
            CLAUDE_CODE_SESSION_ID: '',
            HOME: scene.homeDir,
          },
        }),
      );

      then('exit code is 2, and the halt names the cwd and its slug', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('no transcript for this directory');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case14] a corpus where no transcript made a metered call', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.unmeteredDir, '*.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, a constraint, and each file is named', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('no transcript could be read');
        expect(res.stderr).toContain(`${uuidUnmetered}.jsonl`);
        expect(res.stderr).toContain(`${uuidUnmeteredTwo}.jsonl`);
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case15] --from with no value', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: true },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, and the halt says what --from takes', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('--from needs a value');
      });

      then('the fix carries a command to paste, as every other halt does', () => {
        expect(res.stderr).toContain('rhx reflect.on.token.spend --from @current');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case16] a glob that matches no file', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.tempDir, 'none-*.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, and the halt names the glob', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('transcript glob matched no file');
        expect(res.stderr).toContain('none-*.jsonl');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case17] a transcript cut by a compaction', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.compactedPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the rebase is named with its call', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('rebases = 1');
        expect(res.stdout).toContain('call 4 · compaction');
      });

      then('the summary is held as its own row', () => {
        expect(res.stdout).toContain('compaction.summary');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case18] a subagent transcript passed by its own path', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.subagentPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the header names its parent session', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain(`subagent of = ${uuidParent}`);
        expect(res.stdout).toContain('calls = 3');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case19] a session that never booted its instructions', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.unbootedPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the caveat says where the boot share sits', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain(
          'caveat = no boot.instructions block was seen; the boot share sits inside unattributed',
        );
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case20] @current in a live session, its last line half-flushed', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: {},
          cwd: scene.tempDir,
          env: { ...scene.env, CLAUDE_CODE_SESSION_ID: uuidLive },
        }),
      );

      then('exit code is 0, and the session is chosen by its id', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('chosen by = session-id');
        expect(res.stdout).toContain('calls = 3');
      });

      then('the half-flushed tail is named, never read as a fault', () => {
        expect(res.stdout).toContain('partial lines skipped = 1 (a live tail)');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case21] a corpus of one metered session and one unmetered', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.mixedDir, '*.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the counts name the skip', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain(
          'matched = 2 · metered = 1 · skipped = 1',
        );
      });

      then('the unmetered file sits under its own bucket', () => {
        expect(res.stdout).toContain('unmetered (1)');
        expect(res.stdout).toContain(`${uuidMixedUnmetered}.jsonl`);
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case22] a parent transcript with a subagent beside it', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.parentPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the subagent is a peer row of its own spend', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('subagents (1, their own spend)');
        expect(res.stdout).toContain('agent-a1.jsonl');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case23] a corpus where one file is torn and one is unmetered', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.mixedSkipDir, '*.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, a constraint', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('no transcript could be read');
      });

      then('the halt names both fixes, never only the repoint', () => {
        expect(res.stderr).toContain(
          're-copy each malformed file from its source, and point past each unmetered one',
        );
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case24] @current with no session id, in a dir with two sessions', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: {},
          cwd: scene.tempDir,
          env: {
            CLAUDE_CONFIG_DIR: scene.mtimeConfigDir,
            CLAUDE_CODE_SESSION_ID: '',
            HOME: scene.homeDir,
          },
        }),
      );

      then('exit code is 0, and the newest session is chosen by mtime', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('chosen by = mtime');
        expect(res.stdout).toContain(`${uuidTwo}.jsonl`);
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case25] two selectors, one that matches and one that matches none', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: {
            from: [
              path.join(scene.projectDir, `${uuidOne}.jsonl`),
              path.join(scene.tempDir, 'nope-*.jsonl'),
            ],
          },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, and the halt names the dead selector', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('transcript glob matched no file');
        expect(res.stderr).toContain('nope-*.jsonl');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case26] a transcript on a model no rate card names', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.unpricedPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the model is named', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('claude-mystery-1');
      });

      then('the figures read unpriced, never a false $0.00', () => {
        expect(res.stdout).toContain('unpriced');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case27] a corpus of one metered, one torn, and one unmetered session', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: path.join(scene.mixedReadDir, '*.jsonl') },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the counts name both skips', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('matched = 3 · metered = 1 · skipped = 2');
      });

      then('each skip sits under its own bucket', () => {
        expect(res.stdout).toContain('malformed (1)');
        expect(res.stdout).toContain('unmetered (1)');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case28] a reader that closes stdout before the tree is written', () => {
    when('[t0] the skill output is piped into `head -c 0`', () => {
      // pipefail, so the shell reports the skill's own exit, not head's
      const res = useThen('the pipeline ends', async () => {
        const skillPath = path.join(
          scene.tempDir,
          '.agent/repo=bhrain/role=reflector/skills/reflect.on.token.spend.sh',
        );
        const cmd = `bash -o pipefail -c 'bash "${skillPath}" --from ${uuidOne} | head -c 0'`;
        const options = {
          cwd: scene.tempDir,
          env: { ...process.env, ...scene.env },
        };
        return execAsync(cmd, options)
          .then((result) => ({ ...result, code: 0 }))
          .catch((error: { stdout?: string; stderr?: string; code?: number }) => ({
            stdout: error.stdout ?? '',
            stderr: error.stderr ?? '',
            code: error.code ?? 1,
          }));
      });

      then('exit code is 0 — a closed reader is not a fault', () => {
        expect(res.code).toEqual(0);
      });

      then('stderr carries no EPIPE stack and no malfunction header', () => {
        expect(res.stderr).not.toContain('EPIPE');
        expect(res.stderr).not.toContain('💥');
      });

      then('stdout and stderr match snapshot', () => {
        expect({
          stdout: asSnap(res.stdout),
          stderr: asSnap(res.stderr),
        }).toMatchSnapshot();
      });
    });
  });

  given('[case29] @current where the session id names no transcript', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: {},
          cwd: scene.tempDir,
          env: {
            ...scene.env,
            CLAUDE_CODE_SESSION_ID: '44444444-4444-4444-8444-444444444444',
          },
        }),
      );

      then('exit code is 2, and the mtime fallback is never taken', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('transcript not found');
        expect(res.stderr).toContain('44444444-4444-4444-8444-444444444444');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case30] a compacted parent with a subagent beside it', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.compactParentPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 0, and the rebase is named with its call', () => {
        expect(res.code).toEqual(0);
        expect(res.stdout).toContain('rebases = 1');
        expect(res.stdout).toContain('call 4 · compaction');
      });

      then('the subagent is still a peer row of its own spend', () => {
        expect(res.stdout).toContain('subagents (1, their own spend)');
        expect(res.stdout).toContain('agent-d1.jsonl');
      });

      then('stdout matches snapshot', () => {
        expect(asSnap(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case31] a parent read alone, whose subagent file is torn', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.tornParentPath },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 1, a malfunction of the subagent file', () => {
        expect(res.code).toEqual(1);
      });

      then('stderr names the torn subagent file and its line, never its parent', () => {
        expect(res.stderr).toContain(
          path.join(uuidTornParent, 'subagents', 'agent-b1.jsonl'),
        );
        expect(res.stderr).toContain('2 of 3');
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case32] a path that names a directory', () => {
    when('[t0] the skill runs', () => {
      const res = useThen('it fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.on.token.spend',
          subcommand: null,
          args: { from: scene.unmeteredDir },
          cwd: scene.tempDir,
          env: scene.env,
        }),
      );

      then('exit code is 2, a constraint, never a raw EISDIR', () => {
        expect(res.code).toEqual(2);
        expect(res.stderr).toContain('transcript path is a directory');
        expect(res.stderr).not.toContain('EISDIR');
      });

      then('the fix names a quoted glob over that directory', () => {
        expect(res.stderr).toContain(
          `--from '${path.join(scene.unmeteredDir, '*.jsonl')}'`,
        );
      });

      then('stderr matches snapshot', () => {
        expect(asSnap(res.stderr)).toMatchSnapshot();
      });
    });
  });
});
