import { UnexpectedCodePathError } from 'helpful-errors';

import { ContextOpenAI } from '@src/access/sdk/sdkOpenAi';

/**
 * .what = creates ContextOpenAI from environment
 * .why = enables thinker skills to use openai
 *
 * todo: cutover to BrainAtom from rhachet-brains-openai
 */
export const getContextOpenAI = (): ContextOpenAI => ({
  openai: {
    auth: {
      key:
        process.env.OPENAI_API_KEY ??
        UnexpectedCodePathError.throw('OPENAI_API_KEY not declared in env'),
    },
    llm: {
      // model: 'gpt-4-turbo-2024-04-09',
      model: 'gpt-4o',
      output: 'words',
    },
  },
});
