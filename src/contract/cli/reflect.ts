/**
 * .what = cli entry point for reviewer.reflect skill
 *
 * .why  = enables portable invocation via package import pattern
 */
import { z } from 'zod';

import { printBrainHelp } from '@src/_topublish/rhachet/genContextBrainChoice';
import { stepReflect } from '@src/domain.operations/reflect/stepReflect';
import { getCliArgs } from '@src/infra/cli/getCliArgs';

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    source: z.string().optional(),
    target: z.string().optional(),
    mode: z.enum(['pull', 'push']).optional(),
    force: z.string().optional(),
    brain: z.string().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

/**
 * .what = cli entry point for reflect skill
 *
 * .why  = enables portable dispatch via package import
 */
export const reflect = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // handle --brain help
  if (named.brain === 'help') {
    printBrainHelp();
    process.exit(0);
  }

  // validate required args
  if (!named.source) {
    console.error('error: --source is required');
    process.exit(1);
  }
  if (!named.target) {
    console.error('error: --target is required');
    process.exit(1);
  }

  // invoke stepReflect with parsed args
  await stepReflect({
    source: named.source,
    target: named.target,
    mode: named.mode,
    force: named.force === 'true',
    brain: named.brain,
  });
};
