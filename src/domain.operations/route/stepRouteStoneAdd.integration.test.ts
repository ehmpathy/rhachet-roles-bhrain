import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { stepRouteStoneAdd } from './stepRouteStoneAdd';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneAdd.integration', () => {
  given('[case1] empty route, plan mode with stdin', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-add-plan-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.empty'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] plan mode with @stdin source', () => {
      then('returns preview without file creation', async () => {
        const result = await stepRouteStoneAdd({
          stone: '3.1.research.custom',
          source: '@stdin',
          stdin: 'investigate X\n- what is X?',
          route: tempDir,
          mode: 'plan',
        });

        expect(result.created).toBe(false);
        expect(result.content).toContain('investigate X');
        expect(result.path).toContain('3.1.research.custom.stone');

        // file should not exist
        const stoneExists = await fs
          .access(result.path)
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(false);
      });

      then('emits treestruct with plan header', async () => {
        const result = await stepRouteStoneAdd({
          stone: '3.1.research.custom',
          source: '@stdin',
          stdin: 'investigate X\n- what is X?',
          route: tempDir,
          mode: 'plan',
        });

        const stdout = result.emit?.stdout ?? '';
        expect(stdout).toContain('🦉 another stone on the path');
        expect(stdout).toContain('🗿 route.stone.add --mode plan');
        expect(stdout).toContain('preview');
        expect(stdout).toContain('rerun with --mode apply to execute');
      });
    });
  });

  given('[case2] empty route, apply mode with stdin', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-add-apply-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.empty'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] apply mode with @stdin source', () => {
      then('creates stone file', async () => {
        const result = await stepRouteStoneAdd({
          stone: '3.1.research.custom',
          source: '@stdin',
          stdin: 'investigate X\n- what is X?',
          route: tempDir,
          mode: 'apply',
        });

        expect(result.created).toBe(true);

        // file should exist
        const stoneExists = await fs
          .access(result.path)
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(true);

        // content matches
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toBe('investigate X\n- what is X?');
      });

      then('emits treestruct with apply header', async () => {
        const result = await stepRouteStoneAdd({
          stone: '3.1.research.adhoc',
          source: '@stdin',
          stdin: 'adhoc research',
          route: tempDir,
          mode: 'apply',
        });

        const stdout = result.emit?.stdout ?? '';
        expect(stdout).toContain('🦉 another stone on the path');
        expect(stdout).toContain('🗿 route.stone.add --mode apply');
        expect(stdout).toContain('created =');
        expect(stdout).toContain('the way continues, run');
        expect(stdout).toContain('rhx route.drive');
      });
    });
  });

  given('[case3] simple route with template source', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-add-template-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] apply mode with template source', () => {
      then('creates stone with template content', async () => {
        const result = await stepRouteStoneAdd({
          stone: '3.2.research.adhoc',
          source: 'template($behavior/refs/template.research.adhoc.stone)',
          stdin: null,
          route: tempDir,
          mode: 'apply',
        });

        expect(result.created).toBe(true);
        expect(result.content).toContain('research: adhoc');
        expect(result.content).toContain('investigate the topic');

        // file content matches template
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('research: adhoc');
      });
    });
  });

  given('[case4] collision detection', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-add-collision-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.empty'), tempDir, {
        recursive: true,
      });
      // create a stone
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        'vision content',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone exists with different content', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          stepRouteStoneAdd({
            stone: '1.vision',
            source: '@stdin',
            stdin: 'different content',
            route: tempDir,
            mode: 'apply',
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain(
          'stone already exists with different content',
        );
      });
    });

    when('[t1] stone exists with same content (findsert)', () => {
      then('returns created: false without error', async () => {
        const result = await stepRouteStoneAdd({
          stone: '1.vision',
          source: '@stdin',
          stdin: 'vision content',
          route: tempDir,
          mode: 'apply',
        });

        expect(result.created).toBe(false);
        expect(result.emit).toBeNull();
      });
    });

    when(
      '[t2] the stone path holds a dir, which the stone scan does not list',
      () => {
        then(
          'the exclusive write refuses with the path and the fix',
          async () => {
            await fs.mkdir(path.join(tempDir, '2.criteria.stone'));
            const error = await getError(
              stepRouteStoneAdd({
                stone: '2.criteria',
                source: '@stdin',
                stdin: 'criteria content',
                route: tempDir,
                mode: 'apply',
              }),
            );

            expect(error).toBeInstanceOf(BadRequestError);
            expect(error.message).toContain('stone path already taken');
            expect(
              error.message.split(tempDir).join('$ROUTE'),
            ).toMatchSnapshot();
          },
        );
      },
    );
  });

  given('[case5] invalid stone name', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-add-invalid-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.empty'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone name lacks numeric prefix', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          stepRouteStoneAdd({
            stone: 'research.custom',
            source: '@stdin',
            stdin: 'content',
            route: tempDir,
            mode: 'apply',
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('numeric prefix');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] stone name lacks alpha segment', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          stepRouteStoneAdd({
            stone: '3.1.6',
            source: '@stdin',
            stdin: 'content',
            route: tempDir,
            mode: 'apply',
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('alpha segment');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case6] route not found', () => {
    when('[t0] route does not exist', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          stepRouteStoneAdd({
            stone: '1.vision',
            source: '@stdin',
            stdin: 'content',
            route: '/nonexistent/route',
            mode: 'apply',
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('route not found');
        expect(error.message).toContain('rhx route.bind.get');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case7] empty stdin', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-add-empty-stdin-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.empty'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stdin is empty', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          stepRouteStoneAdd({
            stone: '1.vision',
            source: '@stdin',
            stdin: '',
            route: tempDir,
            mode: 'apply',
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('no content provided via stdin');
      });
    });
  });

  given('[case8] template not found', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-add-template-absent-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.empty'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] template file does not exist', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          stepRouteStoneAdd({
            stone: '1.vision',
            source: 'template($behavior/refs/nonexistent.stone)',
            stdin: null,
            route: tempDir,
            mode: 'apply',
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('template file not found');
      });
    });
  });
});
