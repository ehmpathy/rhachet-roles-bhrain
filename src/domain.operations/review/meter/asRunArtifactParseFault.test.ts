import { given, then, when } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { asRunArtifactParseFault } from './asRunArtifactParseFault';

describe('asRunArtifactParseFault', () => {
  given('[case1] a SyntaxError from a torn body', () => {
    when('[t0] classified', () => {
      const fault = asRunArtifactParseFault({
        error: new SyntaxError('Unexpected end of JSON input'),
        dir: '/run',
        file: 'input.scope.debug.json',
      });

      then('it becomes a ReviewRunArtifactError', () => {
        expect(fault).toBeInstanceOf(ReviewRunArtifactError);
      });

      then('it names the file', () => {
        expect(String(fault)).toContain('input.scope.debug.json');
      });
    });
  });

  given('[case2] a RangeError from the engine', () => {
    when('[t0] classified', () => {
      const error = new RangeError('Maximum call stack size exceeded');
      const fault = asRunArtifactParseFault({
        error,
        dir: '/run',
        file: 'input.scope.debug.json',
      });

      then('🔴 it surfaces as itself, never renamed as a torn artifact', () => {
        expect(fault).toBe(error);
        expect(fault).not.toBeInstanceOf(ReviewRunArtifactError);
      });
    });
  });
});
