import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';

import { asAllManifestHookSites, type RepoHookSite } from './asAllManifestHookSites';
import { getRepoClaudeSettingsPath } from './getRepoClaudeSettingsPath';

/**
 * .what = the two settings read faults a caller can name a repair for
 */
export type SettingsReadFault = 'absent' | 'malformed';

/**
 * .what = the repairable fault a settings read raised, or null for any other error
 * .why = an allowlist, so only an absent file (ENOENT) or bad json (SyntaxError) is caught;
 *        a denied read or a defect stays a throw (rule.forbid.failhide)
 */
const asSettingsReadFault = (input: {
  error: unknown;
}): SettingsReadFault | null => {
  if (input.error instanceof SyntaxError) return 'malformed';
  const code =
    input.error instanceof Error && 'code' in input.error
      ? input.error.code
      : null;
  return code === 'ENOENT' ? 'absent' : null;
};

/**
 * .what = the shape of the settings hooks this reader walks
 * .why = settings.json has no shipped type; declare the minimal contract read here
 */
interface SettingsOfHooks {
  hooks?: Record<
    string,
    { hooks?: { command?: string; timeout?: number; author?: string }[] }[]
  >;
}

/**
 * .what = the author rhachet stamps on the one dispatcher hook per event
 */
const AUTHOR_OF_DISPATCH = 'rhachet/hooks.dispatch';

/**
 * .what = every hook site the settings hold, the dispatchers left out
 * .why = a dispatcher only routes to the manifest rows; its own site is no role hook
 */
const asAllSettingsHookSites = (input: {
  settings: SettingsOfHooks;
}): RepoHookSite[] =>
  Object.values(input.settings.hooks ?? {})
    .flat()
    .flatMap((block) => block.hooks ?? [])
    .filter((hook) => hook.author !== AUTHOR_OF_DISPATCH)
    .filter((hook) => !(hook.command ?? '').includes('hooks.dispatch.sh'))
    .map((hook) => ({
      command: hook.command ?? '',
      timeoutSeconds: hook.timeout ?? null,
      author: hook.author ?? null,
    }));

/**
 * .what = every hook site of the repo actor: the settings layer plus the dispatch manifest
 * .why = rhachet 1.54+ moves each role hook out of the settings and into
 *        `hooks.dispatch.manifest`, behind one dispatcher per event. a test that asks "is this
 *        hook registered, and under what timeout" must read both, or it reads a dispatcher
 *
 * .note = an absent or malformed settings file returns null sites and names its fault, so a
 *         caller can name the repair rather than crash in its setup. every other fault
 *         (a denied read, a defect) throws as is
 */
export const getAllRepoHookSites = async (input: {
  repoRoot: string;
}): Promise<{
  file: string;
  sites: RepoHookSite[] | null;
  fault: SettingsReadFault | null;
}> => {
  const file = getRepoClaudeSettingsPath({ repoRoot: input.repoRoot });
  const read = await fs
    .readFile(file, 'utf-8')
    .then((source) => ({
      settings: JSON.parse(source) as SettingsOfHooks,
      fault: null,
    }))
    .catch((error: unknown) => {
      const fault = asSettingsReadFault({ error });
      if (fault === null) throw error;
      return { settings: null, fault };
    });
  if (read.settings === null) return { file, sites: null, fault: read.fault };
  const settings = read.settings;

  // the manifest sits beside the settings layer it serves
  const manifestPath = path.join(path.dirname(file), 'hooks.dispatch.manifest');
  const manifest = existsSync(manifestPath)
    ? await fs.readFile(manifestPath, 'utf-8')
    : '';
  return {
    file,
    sites: [
      ...asAllSettingsHookSites({ settings }),
      ...asAllManifestHookSites({ manifest }),
    ],
    fault: null,
  };
};
