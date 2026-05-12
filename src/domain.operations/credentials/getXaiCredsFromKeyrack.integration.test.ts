import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = integration tests for getXaiCredsFromKeyrack cross-org support
 * .why = verify keyrack commands don't hardcode org; this enables cross-org brains
 *
 * @see https://github.com/ehmpathy/rhachet-roles-bhrain/issues/...
 */
describe('getXaiCredsFromKeyrack', () => {
  given('[case1] the source code of getXaiCredsFromKeyrack', () => {
    when('[t0] we inspect the keyrack command', () => {
      then('it should NOT contain hardcoded --org ehmpathy', async () => {
        const sourcePath = path.join(__dirname, 'getXaiCredsFromKeyrack.ts');
        const sourceCode = await fs.readFile(sourcePath, 'utf-8');

        // the defect: --org ehmpathy is hardcoded in the keyrack get command
        // this test FAILS before the fix, PASSES after
        const hasHardcodedOrg = sourceCode.includes('--org ehmpathy');

        expect(hasHardcodedOrg).toBe(false);
      });

      then('it should allow keyrack to infer org from manifest (@this)', async () => {
        const sourcePath = path.join(__dirname, 'getXaiCredsFromKeyrack.ts');
        const sourceCode = await fs.readFile(sourcePath, 'utf-8');

        // extract the keyrack command from source
        const commandMatch = sourceCode.match(
          /rhx keyrack get[^'"]*/,
        );

        expect(commandMatch).toBeDefined();

        const command = commandMatch![0];

        // verify the command does NOT contain --org (keyrack defaults to @this)
        expect(command).not.toContain('--org');

        // verify essential flags are still present
        expect(command).toContain('--owner ehmpath');
        expect(command).toContain('--key XAI_API_KEY');
        expect(command).toContain('--env prep');
        expect(command).toContain('--json');
      });
    });
  });

  given('[case2] cross-org repo scenario', () => {
    /**
     * .note = this is the actual defect scenario:
     *         - repo has keyrack.yml with org: ahbode
     *         - bhrain calls keyrack with --org ehmpathy
     *         - keyrack fails with org mismatch
     *
     * the fix: remove --org flag, let keyrack infer from manifest
     */
    when('[t0] keyrack command is executed without --org flag', () => {
      then('keyrack reads org from manifest (verified via command structure)', async () => {
        const sourcePath = path.join(__dirname, 'getXaiCredsFromKeyrack.ts');
        const sourceCode = await fs.readFile(sourcePath, 'utf-8');

        // the fix should result in a command like:
        // rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --json
        // without any --org flag

        const commandMatch = sourceCode.match(
          /execSync\(\s*['"`]([^'"`]+rhx keyrack get[^'"`]+)['"`]/,
        );

        expect(commandMatch).toBeDefined();

        const fullCommand = commandMatch![1];

        // the command must NOT contain any --org flag
        // this allows keyrack to use its default @this behavior
        expect(fullCommand).not.toMatch(/--org\s+\S+/);
      });
    });
  });
});
