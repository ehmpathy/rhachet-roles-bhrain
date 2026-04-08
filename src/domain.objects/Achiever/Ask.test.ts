import { given, then, when } from 'test-fns';

import { Ask } from './Ask';

describe('Ask', () => {
  given('[case1] a valid ask', () => {
    when('[t0] instantiated', () => {
      then('it should create the ask', () => {
        const ask = new Ask({
          hash: 'a1b2c3d4e5f6',
          content: 'fix the flaky test in auth.test.ts',
          receivedAt: '2026-04-02',
        });

        expect(ask.hash).toEqual('a1b2c3d4e5f6');
        expect(ask.content).toEqual('fix the flaky test in auth.test.ts');
        expect(ask.receivedAt).toEqual('2026-04-02');
      });
    });
  });

  given('[case2] serialization', () => {
    when('[t0] JSON serialized', () => {
      then('it should produce valid JSON', () => {
        const ask = new Ask({
          hash: 'abc123',
          content: 'update the readme',
          receivedAt: '2026-04-02',
        });

        const json = JSON.stringify(ask);
        const parsed = JSON.parse(json);

        expect(parsed.hash).toEqual('abc123');
        expect(parsed.content).toEqual('update the readme');
        expect(parsed.receivedAt).toEqual('2026-04-02');
      });
    });
  });

  given('[case3] multiline content', () => {
    when('[t0] instantiated with multiline content', () => {
      then('it should preserve newlines', () => {
        const content = `fix the flaky test
and update the readme
and notify me on slack`;

        const ask = new Ask({
          hash: 'multiline-hash',
          content,
          receivedAt: '2026-04-02',
        });

        expect(ask.content).toContain('\n');
        expect(ask.content.split('\n')).toHaveLength(3);
      });
    });
  });
});
