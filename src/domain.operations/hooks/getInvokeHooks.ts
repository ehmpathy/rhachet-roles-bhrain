import type { InvokeHooks } from 'rhachet';

import { execTranslateDocOutputPath } from '@src/domain.operations/hooks/execTranslateDocOutputPath';

export const getInvokeHooks = (): InvokeHooks => ({
  onInvokeAskInput: [
    (input) => {
      console.log('🪝 hook ran!');
      return input;
    },
    (opts) => execTranslateDocOutputPath(opts, { log: console }), // todo: forward log context
  ],
});
