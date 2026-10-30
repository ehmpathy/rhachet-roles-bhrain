import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = this repo's own tracked seat settings bind the same statusLine the driver init writes
 * .why = the init rewrites a seat's settings only when it runs; a tracked settings file that
 *        still names an older command would boot that command on every repaint of every seat
 *        that clones this repo, while each init test stays green
 */
const PATH_OF_TEMPLATE = path.join(__dirname, 'init.claude.status-line.jsonc');
const PATH_OF_REPO_SETTINGS = path.join(
  __dirname,
  '../../../..',
  '.agent/.actors/actor.via.repo=ambient/brain/.claude/settings.of.repo.json',
);

/**
 * .what = parse a jsonc file whose comments sit on their own lines
 * .why = the template carries `//` notes above its keys; none sits after a value
 */
const asJsonFromJsoncLines = (input: {
  content: string;
}): { statusLine: unknown } =>
  JSON.parse(
    input.content
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n'),
  );

describe('init.claude.status-line.parity', () => {
  given(
    '[case1] the driver init template and this repo tracked seat settings',
    () => {
      when('[t0] both statusLine blocks are read', () => {
        const result = useThen('both files parse', async () => {
          const template = asJsonFromJsoncLines({
            content: await fs.readFile(PATH_OF_TEMPLATE, 'utf-8'),
          });
          const settings: { statusLine: unknown } = JSON.parse(
            await fs.readFile(PATH_OF_REPO_SETTINGS, 'utf-8'),
          );
          return { template, settings };
        });

        then('the tracked settings bind the command the init writes', () => {
          expect(result.settings.statusLine).toEqual(
            result.template.statusLine,
          );
        });

        then('the bound command runs the bash reader, never node', () => {
          expect(JSON.stringify(result.settings.statusLine)).toContain(
            'bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh',
          );
          expect(JSON.stringify(result.settings.statusLine)).not.toContain(
            'node -e',
          );
        });
      });
    },
  );
});
