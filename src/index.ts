export * from '@src/contract/sdk';

// cli entry points for portable skill dispatch
import { reflect } from './contract/cli/reflect';
import { review } from './contract/cli/review';

export const cli = {
  reflect,
  review,
};
