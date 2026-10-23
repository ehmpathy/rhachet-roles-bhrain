import * as fs from 'fs';
import * as path from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = an exec-bit clamp on every shell skill this repo declares for itself
 *
 * .why = `rhx <skill>` execs the `.sh` directly, so a skill at mode 644 registers,
 *        appears in `rhx list`, and fails only when a human types it — with empty
 *        stdout and empty stderr. the upstream exec-bit guard walks `dist/`; skills
 *        under `.agent/repo=.this/` never reach `dist/`, so no gate saw them.
 *        `census.review-prefix` shipped that way once; this clamp holds the class
 *
 * .note = a skill meant to be SOURCED (`. path/to/skill.sh`) needs no exec bit and
 *         declares so in its own header. the exemption is read from that header, so
 *         no list here must be kept in sync by hand
 *
 * .note = an integration test, never a unit one — it reads the disk
 *         (`rule.forbid.unit.remote-boundaries`)
 */
const DIR_OF_AGENT = path.join(__dirname, '..', '..', '.agent');
const MARK_OF_SOURCED = 'must be called with `.` or `source`';

const getAllSkillShellFiles = (): string[] =>
  fs
    .readdirSync(DIR_OF_AGENT)
    .filter((repo) => repo === 'repo=.this')
    .flatMap((repo) =>
      fs
        .readdirSync(path.join(DIR_OF_AGENT, repo))
        .filter((role) => role.startsWith('role='))
        .map((role) => path.join(DIR_OF_AGENT, repo, role, 'skills')),
    )
    .filter((dir) => fs.existsSync(dir))
    .flatMap((dir) =>
      fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.sh'))
        .map((file) => path.join(dir, file)),
    );

const isSkillSourced = (input: { file: string }): boolean =>
  fs.readFileSync(input.file, 'utf-8').includes(MARK_OF_SOURCED);

const isFileExecutable = (input: { file: string }): boolean =>
  (fs.statSync(input.file).mode & 0o111) !== 0;

describe('agentSkillsExecutable', () => {
  given('[case1] the shell skills this repo declares for itself', () => {
    const files = getAllSkillShellFiles();

    when('[t0] each is read from disk', () => {
      then('the set is not empty, so the clamp is no vacuous truth', () => {
        expect(files.length).toBeGreaterThan(0);
      });

      then('🔴 every skill rhx execs carries an exec bit', () => {
        const unrunnable = files
          .filter((file) => !isSkillSourced({ file }))
          .filter((file) => !isFileExecutable({ file }))
          .map((file) => path.relative(path.join(DIR_OF_AGENT, '..'), file));
        expect(unrunnable).toEqual([]);
      });
    });
  });
});
