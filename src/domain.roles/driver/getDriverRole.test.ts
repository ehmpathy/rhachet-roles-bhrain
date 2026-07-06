import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { ROLE_DRIVER } from './getDriverRole';

describe('getDriverRole', () => {
  given('[case1] boot.yml completeness', () => {
    when('[t0] briefs directory is enumerated', () => {
      then(
        'every brief in briefs/ is declared in boot.yml as say or ref',
        async () => {
          // enumerate all .md files in briefs/
          const briefsDir = path.join(__dirname, 'briefs');
          const briefFiles = (await fs.readdir(briefsDir))
            .filter((f) => f.endsWith('.md'))
            .map((f) => `briefs/${f}`);

          // read boot.yml content
          const bootPath = path.join(__dirname, 'boot.yml');
          const bootContent = await fs.readFile(bootPath, 'utf-8');

          // verify all briefs are declared in boot.yml
          for (const brief of briefFiles) {
            expect(bootContent).toContain(brief);
          }
        },
      );
    });

    when('[t1] boot.yml declares briefs', () => {
      then('all declared briefs exist in briefs/', async () => {
        // enumerate all .md files in briefs/
        const briefsDir = path.join(__dirname, 'briefs');
        const briefFiles = (await fs.readdir(briefsDir))
          .filter((f) => f.endsWith('.md'))
          .map((f) => `briefs/${f}`);

        // read boot.yml content and extract declared briefs
        const bootPath = path.join(__dirname, 'boot.yml');
        const bootContent = await fs.readFile(bootPath, 'utf-8');

        // extract lines that look like brief declarations
        const declaredBriefs = bootContent
          .split('\n')
          .map((line) => line.trim())
          .filter(
            (line) => line.startsWith('- briefs/') && line.endsWith('.md'),
          )
          .map((line) => line.slice(2)); // remove "- " prefix

        // verify all declared briefs exist
        for (const declared of declaredBriefs) {
          expect(briefFiles).toContain(declared);
        }
      });
    });
  });

  given('[case2] the foreground guard hook', () => {
    when('[t0] the driver role onTool hooks are inspected', () => {
      then('the foreground guard is bound as a Bash before-hook', () => {
        const onTool = ROLE_DRIVER.hooks?.onBrain?.onTool ?? [];
        const guardHook = onTool.find((hook) =>
          hook.command.includes('route.foreground.guard'),
        );

        // the guard must be present so background route.stone.set is blocked
        expect(guardHook).toBeDefined();

        // it must fire before Bash tool calls (where run_in_background lives)
        expect(guardHook?.filter?.what).toEqual('Bash');
        expect(guardHook?.filter?.when).toEqual('before');

        // it must invoke the hook in --mode hook so it reads stdin json
        expect(guardHook?.command).toContain('--mode hook');
      });
    });
  });
});
