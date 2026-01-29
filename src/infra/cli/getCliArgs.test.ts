import { given, then, when } from 'test-fns';
import { z } from 'zod';

import { getCliArgs } from './getCliArgs';

describe('getCliArgs', () => {
  const schema = z.object({
    named: z.object({
      refs: z.union([z.string(), z.array(z.string())]).optional(),
      rules: z.union([z.string(), z.array(z.string())]).optional(),
      paths: z.union([z.string(), z.array(z.string())]).optional(),
      mode: z.string().optional(),
    }),
    ordered: z.array(z.string()).default([]),
  });

  given('[case1] single flag value', () => {
    when('[t0] --refs specified once', () => {
      then('refs is a string', () => {
        const result = getCliArgs({
          schema,
          argv: ['--refs', 'path/to/ref.md'],
        });
        expect(result.named.refs).toEqual('path/to/ref.md');
      });
    });

    when('[t1] --rules specified once', () => {
      then('rules is a string', () => {
        const result = getCliArgs({
          schema,
          argv: ['--rules', 'rules/*.md'],
        });
        expect(result.named.rules).toEqual('rules/*.md');
      });
    });
  });

  given('[case2] repeated flags', () => {
    when('[t0] --refs specified twice', () => {
      then('refs is an array of strings', () => {
        const result = getCliArgs({
          schema,
          argv: ['--refs', 'ref1.md', '--refs', 'ref2.md'],
        });
        expect(result.named.refs).toEqual(['ref1.md', 'ref2.md']);
      });
    });

    when('[t1] --refs specified three times', () => {
      then('refs is an array with three elements', () => {
        const result = getCliArgs({
          schema,
          argv: ['--refs', 'ref1.md', '--refs', 'ref2.md', '--refs', 'ref3.md'],
        });
        expect(result.named.refs).toEqual(['ref1.md', 'ref2.md', 'ref3.md']);
      });
    });

    when('[t2] --rules specified multiple times', () => {
      then('rules is an array of strings', () => {
        const result = getCliArgs({
          schema,
          argv: ['--rules', 'rule1.md', '--rules', 'rule2.md'],
        });
        expect(result.named.rules).toEqual(['rule1.md', 'rule2.md']);
      });
    });
  });

  given('[case3] mixed flags', () => {
    when('[t0] multiple --refs with single --mode', () => {
      then('refs is array, mode is string', () => {
        const result = getCliArgs({
          schema,
          argv: ['--refs', 'ref1.md', '--mode', 'push', '--refs', 'ref2.md'],
        });
        expect(result.named.refs).toEqual(['ref1.md', 'ref2.md']);
        expect(result.named.mode).toEqual('push');
      });
    });
  });

  given('[case4] equals syntax', () => {
    when('[t0] --refs=value specified twice', () => {
      then('refs is an array of strings', () => {
        const result = getCliArgs({
          schema,
          argv: ['--refs=ref1.md', '--refs=ref2.md'],
        });
        expect(result.named.refs).toEqual(['ref1.md', 'ref2.md']);
      });
    });

    when('[t1] mixed equals and space syntax', () => {
      then('refs is an array of strings', () => {
        const result = getCliArgs({
          schema,
          argv: ['--refs=ref1.md', '--refs', 'ref2.md'],
        });
        expect(result.named.refs).toEqual(['ref1.md', 'ref2.md']);
      });
    });
  });

  given('[case5] backwards compat', () => {
    when('[t0] no refs flag', () => {
      then('refs is undefined', () => {
        const result = getCliArgs({
          schema,
          argv: ['--mode', 'push'],
        });
        expect(result.named.refs).toBeUndefined();
      });
    });
  });
});
