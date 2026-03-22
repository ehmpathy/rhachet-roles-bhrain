import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

describe('reflect.snapshot capture', () => {
  given('[case1] repo without claude code project', () => {
    const tempDir = genTempDirForReflector({
      slug: 'reflect-capture-case1',
      clone: ASSETS_DIR,
    });

    beforeAll(async () => {
      await execAsync('npx rhachet roles link --role reflector', {
        cwd: tempDir,
      });
    });

    when('[t0] capture is attempted', () => {
      const result = useThen('skill invocation fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'capture',
          cwd: tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error mentions claude project not found', () => {
        expect(result.stderr.toLowerCase()).toMatch(/claude|project|found|transcript/);
      });

      then('stderr matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  // note: test with real claude project requires manual smoke test
  // because claude code projects are user-specific and not easily mocked
  //
  // smoke test:
  //   cd <repo-with-claude-project>
  //   rhx reflect.snapshot.capture
  //
  // expected output:
  //   - owl header "know thyself"
  //   - transcript stats
  //   - savepoint count
  //   - snapshot path
});
