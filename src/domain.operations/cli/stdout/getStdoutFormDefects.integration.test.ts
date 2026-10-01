import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getStdoutFormDefects } from './getStdoutFormDefects';

/**
 * .what = walks EVERY snapshot in the repo through the treestruct check
 * .why = `S13`: *"why any impropper stdouts anywhere? enrule to ensure that never happens
 *        again"*. a snapshot is the one place each surface's bytes are pinned, so a surface that
 *        renders prose where a tree was owed turns this red the moment it is snapped
 *        (`rule.require.stdout-is-treestruct`)
 *
 * .note = integration, not unit: it reads the filesystem (`rule.forbid.unit.remote-boundaries`)
 */
const REPO_ROOT = path.join(__dirname, '../../../..');

/**
 * .what = the bodies of each entry in a jest `.snap` file
 * .note = jest escapes a backtick and a backslash in the template; both are restored, so the
 *         check reads the bytes the surface emitted
 */
const asSnapshotEntries = (input: {
  content: string;
}): { name: string; body: string }[] =>
  // .note = a one-line entry (`= \`""\`;`) carries no newlines, so they are optional; the
  //         terminator is a backtick jest did NOT escape, so an escaped one mid-body never ends it
  [
    ...input.content.matchAll(
      /^exports\[`([\s\S]*?)`\] = `\n?([\s\S]*?)\n?(?<!\\)`;$/gm,
    ),
  ].map((match) => ({
    name: match[1]!,
    body: match[2]!.replace(/\\`/g, '`').replace(/\\\\/g, '\\'),
  }));

describe('getStdoutFormDefects.integration', () => {
  given('[case1] every snapshot this repo pins', () => {
    const scene = useBeforeAll(async () => {
      const files = await enumFilesFromGlob({
        glob: '{src,blackbox}/**/__snapshots__/*.snap',
        cwd: REPO_ROOT,
        ignore: ['**/node_modules/**'],
      });
      const entries = await Promise.all(
        files.map(async (file) => {
          // .note = the glob yields absolute paths; the report names them repo-relative
          const content = await fs.readFile(file, 'utf8');
          return asSnapshotEntries({ content }).map((entry) => ({
            file: path.relative(REPO_ROOT, file),
            ...entry,
          }));
        }),
      );
      return { files, entries: entries.flat() };
    });

    when('[t0] each entry is read as a stdout', () => {
      then('the walk reaches the snapshots at all', () => {
        // .why = a glob that matched naught would pass the check below vacuously
        expect(scene.files.length).toBeGreaterThan(50);
        expect(scene.entries.length).toBeGreaterThan(500);
      });

      then('no entry renders prose where a tree was owed', () => {
        const defects = scene.entries.flatMap((entry) =>
          getStdoutFormDefects({ text: entry.body }).map(
            (defect) =>
              `${entry.file} › ${entry.name}\n  L${defect.line} ${defect.kind}: ${defect.text}`,
          ),
        );
        expect(defects).toEqual([]);
      });
    });
  });
});
