import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { ROLE_LEARNER } from './getLearnerRole';

/**
 * .what = the repo root, where jest runs; the committed .claude/settings.json lives here
 * .why = getLearnerRole.test proves the role DECLARES its hooks in-memory, but Claude Code
 *        fires hooks from the committed .claude/settings.json — a separate file no boot step
 *        writes. a role can declare an onStop/onTool command that is ABSENT from settings.json,
 *        and the whole hook silently never fires (exactly the gap that shipped the inert
 *        sweephook). this asserts every learner-authored hook command the role declares is
 *        actually present in the committed settings.json, so the declaration + the settings
 *        entry can never drift apart unnoticed (rule.forbid.failhide)
 */
const REPO_ROOT = process.cwd();
const SETTINGS_PATH = path.join(REPO_ROOT, '.claude/settings.json');

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

describe('getLearnerRole hook registration (integration)', () => {
  given('[case1] the committed .claude/settings.json', () => {
    when('[t0] it is read alongside the role declaration', () => {
      const result = useThen('settings.json is present', async () => ({
        commands: asAllSettingsCommands(
          JSON.parse(await fs.readFile(SETTINGS_PATH, 'utf-8')) as Settings,
        ),
      }));

      then('the declared onStop sweephook command is registered', () => {
        // the domain-term sweephook only fires if Claude Code sees it in settings.json;
        // this pins the declaration (getLearnerRole) to the committed settings entry
        const onStop = ROLE_LEARNER.hooks?.onBrain?.onStop ?? [];
        expect(onStop.length).toBeGreaterThan(0);
        for (const hook of onStop)
          expect(result.commands).toContain(hook.command);
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
