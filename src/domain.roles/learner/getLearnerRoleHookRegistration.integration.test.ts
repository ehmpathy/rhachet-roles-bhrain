import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { getRepoClaudeSettingsPath } from '@src/.test/getRepoClaudeSettingsPath';

import { ROLE_LEARNER } from './getLearnerRole';

/**
 * .what = the repo root, where jest runs; the committed claude settings live here
 * .why = getLearnerRole.test proves the role DECLARES its hooks in-memory, but Claude Code
 *        fires hooks from the committed settings file — a separate file no boot step
 *        writes. a role can declare an onStop/onTool command that is ABSENT from settings,
 *        and the whole hook silently never fires (exactly the gap that shipped the inert
 *        sweephook). the drift runs both ways: a settings entry can also outlive the role
 *        declaration that authored it, and then fires with no role behind it. this asserts
 *        the two sides agree — declared commands are registered, withdrawn ones are gone —
 *        so neither direction can drift unnoticed (rule.forbid.failhide)
 */
const REPO_ROOT = process.cwd();
const SETTINGS_PATH = getRepoClaudeSettingsPath({ repoRoot: REPO_ROOT });

/**
 * .what = the shape of a Claude Code settings hook entry we depend on
 * .why = settings.json has no shipped type; declare the minimal contract this test reads
 */
type SettingsHook = { command?: string; author?: string };
type SettingsBlock = { hooks?: SettingsHook[] };
type Settings = { hooks?: Record<string, SettingsBlock[]> };

/**
 * .what = every hook command string in the committed settings.json, across all events
 * .why = flatten so a declared command can be checked for membership regardless of which
 *        event array (Stop, PreToolUse, …) it lands in
 */
const asAllSettingsCommands = (settings: Settings): string[] =>
  Object.values(settings.hooks ?? {})
    .flat()
    .flatMap((block) => block.hooks ?? [])
    .map((hook) => hook.command ?? '');

/**
 * .what = every rule command in the hooks.dispatch manifest beside the settings
 * .why = under rhachet's dispatcher (1.54+), settings hold one dispatch line per event and the role
 *        commands live in the manifest, one `# Event · filter · timeout · repo/role · command` title
 *        line per rule. a declared command is registered when its title line is there
 */
const asAllManifestCommands = (manifest: string): string[] =>
  manifest
    .split('\n')
    .filter((line) => line.startsWith('# ') && line.includes(' · '))
    .map((line) => line.split(' · ').slice(4).join(' · '))
    .filter((command) => command.length > 0);

/**
 * .what = the manifest text beside a settings file, or empty when the seat has no dispatcher
 * .why = an older layout registers every command in settings itself, with no manifest to read
 */
const getManifestTextBeside = async (input: {
  settingsPath: string;
}): Promise<string> => {
  const manifestPath = path.join(
    path.dirname(input.settingsPath),
    'hooks.dispatch.manifest',
  );
  if (!existsSync(manifestPath)) return '';
  return fs.readFile(manifestPath, 'utf-8');
};

describe('getLearnerRole hook registration (integration)', () => {
  given('[case1] the committed .claude/settings.json', () => {
    when('[t0] it is read alongside the role declaration', () => {
      const result = useThen('settings.json is present', async () => ({
        commands: [
          ...asAllSettingsCommands(
            JSON.parse(await fs.readFile(SETTINGS_PATH, 'utf-8')) as Settings,
          ),
          ...asAllManifestCommands(
            await getManifestTextBeside({ settingsPath: SETTINGS_PATH }),
          ),
        ],
      }));

      then('the withdrawn onStop sweephook is absent from both sides', () => {
        // the domain-term sweephook was withdrawn. the drift hazard runs BOTH ways:
        // a declared-but-unregistered hook never fires, and an undeclared-but-still-
        // registered hook fires with no role behind it. so the withdrawal is only
        // real when the declaration AND the settings entry are gone together
        const onStop = ROLE_LEARNER.hooks?.onBrain?.onStop ?? [];
        expect(onStop).toHaveLength(0);
        expect(
          result.commands.filter((command) =>
            command.includes('learn.domain.terms'),
          ),
        ).toEqual([]);
      });

      then('the declared onTool guard command is registered', () => {
        // same guarantee for the memory guard, so neither learner hook can be
        // declared-but-absent (the failhide class this test exists to catch)
        const onTool = ROLE_LEARNER.hooks?.onBrain?.onTool ?? [];
        expect(onTool.length).toBeGreaterThan(0);
        for (const hook of onTool)
          expect(result.commands).toContain(hook.command);
      });
    });
  });
});
