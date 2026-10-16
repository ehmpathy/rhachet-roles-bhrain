import { MalfunctionError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asDependencyManifestParseFault } from './asDependencyManifestParseFault';

/**
 * .what = a real SyntaxError, thrown by the real parser over a torn manifest
 */
const genSyntaxErrorOfTornManifest = (): unknown => {
  try {
    return JSON.parse('{"repository":');
  } catch (error) {
    return error;
  }
};

describe('asDependencyManifestParseFault', () => {
  given('[case1] a SyntaxError from a torn manifest', () => {
    when('[t0] classified', () => {
      const fault = asDependencyManifestParseFault({
        error: genSyntaxErrorOfTornManifest(),
        path: 'node_modules/foo/package.json',
      });

      then('it becomes a MalfunctionError', () => {
        expect(fault).toBeInstanceOf(MalfunctionError);
      });

      then('it names the manifest path', () => {
        expect(String(fault)).toContain('node_modules/foo/package.json');
      });
    });
  });

  given('[case2] a RangeError from the engine', () => {
    when('[t0] classified', () => {
      const error = new RangeError('Maximum call stack size exceeded');
      const fault = asDependencyManifestParseFault({
        error,
        path: 'node_modules/foo/package.json',
      });

      then('🔴 it surfaces as itself, never renamed as a torn manifest', () => {
        expect(fault).toBe(error);
        expect(fault).not.toBeInstanceOf(MalfunctionError);
      });
    });
  });
});
