import { given, then, when } from 'test-fns';

import { formatGuardMalfunctionClearLines } from './formatGuardMalfunctionClearLines';

const STONE = '5.1.execution';
const HEAD = `rhx route.stone.set --stone ${STONE}`;
const ESCALATION =
  'ask a human only for a grant you cannot make (an absent credential, a permission, etc)';

describe('formatGuardMalfunctionClearLines', () => {
  given('[case1] a judge broke on a transient fault', () => {
    when('[t0] the block renders at an open `├─` lead', () => {
      const lines = formatGuardMalfunctionClearLines({
        stone: STONE,
        reason: ['1 judge malfunctioned', 'j1: request timed out'].join('\n'),
        indent: '   ',
        branch: '├─',
      });
      const output = lines.join('\n');

      then('the lead opens the block, on its branch', () => {
        expect(lines[0]).toEqual('   ├─ still yours to clear');
      });

      then('the judge is named with its cause and class, and no fix', () => {
        expect(output).toContain('💥 judge j1 broke');
        expect(output).toContain('cause = request timed out (transient)');
        expect(output).not.toContain('fix =');
      });

      then('a judge owes no answer, so the answer step drops out', () => {
        expect(output).not.toContain('answer each broken lane');
        expect(output).not.toContain('--as absorbed');
      });

      then('the shared next reads, then re-arrives, as steps 1 and 2', () => {
        expect(output).toContain('1. read each given for its cause');
        expect(output).toContain('2. re-arrive');
        expect(output).toContain(`${HEAD} --as arrived`);
      });

      then('the escalation closes the block, as a peer of the steps', () => {
        expect(lines[lines.length - 1]).toEqual(`   │     └─ ${ESCALATION}`);
      });

      then('no line joins a label to its value with a colon', () => {
        expect(output).not.toMatch(/\b(cause|next|fix|diagnose): /);
      });

      then('the bytes a driver reads are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] two review lanes broke — a bad glob and a credential', () => {
    when('[t0] the block renders at a closed `└─` lead', () => {
      const lines = formatGuardMalfunctionClearLines({
        stone: STONE,
        reason: [
          '2 of 4 reviewers malfunctioned',
          'r2 mechanic: glob matched no files: src/absent/**',
          'r3 architect: api key absent for openrouter',
        ].join('\n'),
        indent: '      ',
        branch: '└─',
      });
      const output = lines.join('\n');

      then('each lane is named with its slug, index, and cause', () => {
        expect(output).toContain('💥 lane mechanic (r2) broke');
        expect(output).toContain('(glob)');
        expect(output).toContain('💥 lane architect (r3) broke');
        expect(output).toContain('(credential)');
      });

      then('the glob part names its guard edit as its fix', () => {
        expect(output).toContain(
          `fix = narrow that lane's --paths-wout / --paths-with, in $route/${STONE}.guard`,
        );
      });

      then('the credential part names a human grant as its fix', () => {
        expect(output).toContain(
          'fix = ask a human for the grant the cause names',
        );
      });

      then('the answer step names each broken lane by its own command', () => {
        expect(output).toContain(
          '2. answer each broken lane, like a rejected one',
        );
        expect(output).toContain(`${HEAD} --as absorbed --that mechanic`);
        expect(output).toContain(`${HEAD} --as absorbed --that architect`);
      });

      then(
        'the answer precedes the re-arrive, as the entrance gate demands',
        () => {
          expect(output.indexOf('--as absorbed')).toBeLessThan(
            output.indexOf('--as arrived'),
          );
        },
      );

      then('the re-arrive renders once, never once per part', () => {
        expect(output.match(/--as arrived/g)?.length).toEqual(1);
      });

      then('the bytes a driver reads are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case4] a review lane broke on a cause no class names', () => {
    when('[t0] the block renders', () => {
      const lines = formatGuardMalfunctionClearLines({
        stone: STONE,
        reason: ['1 of 1 reviewer malfunctioned', 'r1 bash: exit code 1'].join(
          '\n',
        ),
        indent: '   ',
        branch: '└─',
      });
      const output = lines.join('\n');

      then('the part shows its cause alone, no fix of its own', () => {
        expect(output).toContain('cause = exit code 1 (unknown)');
        expect(output).not.toContain('fix =');
      });

      then('the shared steps read, answer, then re-arrive', () => {
        expect(output).toContain('1. read each given for its cause');
        expect(output).toContain(`${HEAD} --as absorbed --that bash`);
        expect(output).toContain('3. re-arrive');
      });

      then('it names where a grant the driver cannot make goes', () => {
        expect(output).toContain(ESCALATION);
      });

      then('the bytes a driver reads are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] a record that predates the per-part lines', () => {
    when('[t0] the block renders with no reason', () => {
      const lines = formatGuardMalfunctionClearLines({
        stone: STONE,
        reason: null,
        indent: '   ',
        branch: '├─',
      });
      const output = lines.join('\n');

      then('it still names the shared steps, the answer among them', () => {
        expect(output).toContain('1. read each given for its cause');
        expect(output).toContain(
          '2. answer each broken lane, like a rejected one',
        );
        expect(output).toContain('3. re-arrive');
      });

      then('it names no lane command it cannot know', () => {
        expect(output).not.toContain('--as absorbed');
      });

      then('it names where a grant the driver cannot make goes', () => {
        expect(output).toContain(ESCALATION);
      });

      then('the bytes a driver reads are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });
});
