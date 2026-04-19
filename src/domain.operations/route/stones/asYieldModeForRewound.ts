import { BadRequestError } from 'helpful-errors';

/**
 * .what = validates yield flags and returns yield mode for rewound action
 * .why = encapsulates yield flag validation logic in one place
 */
export const asYieldModeForRewound = (input: {
  asAction: string | undefined;
  hard: string | undefined;
  soft: string | undefined;
  yield: string | undefined;
}): 'keep' | 'drop' | undefined => {
  const hasYield = input.yield !== undefined;
  const hasHard = input.hard === 'true';
  const hasSoft = input.soft === 'true';

  // not rewound action — yield flags not applicable
  if (input.asAction !== 'rewound') {
    // but if yield flags provided, error
    if (hasYield || hasHard || hasSoft) {
      throw new BadRequestError(
        '--yield, --hard, and --soft are only valid with --as rewound',
        { hint: '--help for usage' },
      );
    }
    return undefined;
  }

  // --hard and --soft are mutually exclusive
  if (hasHard && hasSoft) {
    throw new BadRequestError('--hard and --soft are mutually exclusive', {
      hint: '--help for usage',
    });
  }

  // --hard conflicts with --yield keep
  if (hasHard && input.yield === 'keep') {
    throw new BadRequestError('--hard conflicts with --yield keep', {
      hint: '--help for usage',
    });
  }

  // --soft conflicts with --yield drop
  if (hasSoft && input.yield === 'drop') {
    throw new BadRequestError('--soft conflicts with --yield drop', {
      hint: '--help for usage',
    });
  }

  // --yield value must be 'keep' or 'drop'
  if (hasYield && input.yield !== 'keep' && input.yield !== 'drop') {
    throw new BadRequestError('--yield must be "keep" or "drop"', {
      hint: '--help for usage',
    });
  }

  // derive final yield mode
  if (hasHard) return 'drop';
  if (hasSoft) return 'keep';
  if (input.yield === 'drop') return 'drop';
  if (input.yield === 'keep') return 'keep';
  return 'keep'; // default
};
