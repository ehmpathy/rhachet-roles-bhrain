import { given, then, when } from 'test-fns';

import { getStdoutFormDefects } from '../cli/stdout/getStdoutFormDefects';
import { asLibrarianHelpLines } from './asLibrarianHelpLines';
import {
  LIBRARIAN_COMMANDS,
  type LibrarianCommand,
} from './LIBRARIAN_COMMANDS';

describe('asLibrarianHelpLines', () => {
  const commands = Object.keys(LIBRARIAN_COMMANDS) as LibrarianCommand[];

  commands.forEach((command) => {
    given(`[case:${command}] the help of ${command}`, () => {
      when('[t0] the help is rendered', () => {
        const lines = asLibrarianHelpLines({ command });

        then('it opens with the owl vibe line, then a librarian root', () => {
          expect(lines[0]).toMatch(/^🦉 /);
          expect(lines[1]).toEqual('');
          expect(lines[2]).toMatch(/^📚 /);
        });

        then('it names every flag the command reads', () => {
          LIBRARIAN_COMMANDS[command].flags.forEach((flag) => {
            expect(lines.join('\n')).toContain(`--${flag.name}`);
          });
        });

        then('it holds the treestruct form', () => {
          expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
        });
      });
    });
  });

  given('[case:usage] the usage line', () => {
    when('[t0] a required flag and an optional flag are rendered', () => {
      const lines = asLibrarianHelpLines({ command: 'brief.min.moveout' });

      then(
        'the required flag reads bare and the optional one in brackets',
        () => {
          expect(lines).toContain(
            '   ├─ usage: rhx brief.min.moveout --glob <glob> [--mode <mode>]',
          );
        },
      );
    });
  });
});
