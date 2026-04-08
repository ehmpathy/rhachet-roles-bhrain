import { given, then, when } from 'test-fns';

import { Coverage } from './Coverage';

describe('Coverage', () => {
  given('[case1] a valid coverage entry', () => {
    when('[t0] instantiated', () => {
      then('it should create the coverage', () => {
        const coverage = new Coverage({
          hash: 'a1b2c3d4e5f6',
          goalSlug: 'fix-auth-test',
          coveredAt: '2026-04-02',
        });

        expect(coverage.hash).toEqual('a1b2c3d4e5f6');
        expect(coverage.goalSlug).toEqual('fix-auth-test');
        expect(coverage.coveredAt).toEqual('2026-04-02');
      });
    });
  });

  given('[case2] serialization', () => {
    when('[t0] JSON serialized', () => {
      then('it should produce valid JSON', () => {
        const coverage = new Coverage({
          hash: 'abc123',
          goalSlug: 'update-readme',
          coveredAt: '2026-04-02',
        });

        const json = JSON.stringify(coverage);
        const parsed = JSON.parse(json);

        expect(parsed.hash).toEqual('abc123');
        expect(parsed.goalSlug).toEqual('update-readme');
        expect(parsed.coveredAt).toEqual('2026-04-02');
      });
    });
  });

  given('[case3] multiple asks covered by same goal', () => {
    when('[t0] two coverage entries with same goalSlug', () => {
      then('each entry should be distinct by hash', () => {
        const coverage1 = new Coverage({
          hash: 'hash-1',
          goalSlug: 'multi-part-goal',
          coveredAt: '2026-04-02',
        });

        const coverage2 = new Coverage({
          hash: 'hash-2',
          goalSlug: 'multi-part-goal',
          coveredAt: '2026-04-02',
        });

        expect(coverage1.goalSlug).toEqual(coverage2.goalSlug);
        expect(coverage1.hash).not.toEqual(coverage2.hash);
      });
    });
  });
});
