import { execSync } from 'child_process';
import type { BrainSuppliesXai } from 'rhachet-brains-xai';

/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 *
 * .note = uses CLI via spawn for proper context resolution
 * .note = also sets process.env.XAI_API_KEY for current rhachet compatibility
 *         (rhachet's genContextBrain does not yet pass supplier context through)
 * .note = checks environment variable first to support CI/test environments
 *         where keyrack daemon may not be accessible
 */
export const getXaiCredsFromKeyrack = async (): Promise<{
  supplier: { 'brain.supplier.xai': BrainSuppliesXai };
}> => {
  // check if XAI_API_KEY is already in environment (CI/test environments)
  // this allows tests to run without keyrack daemon access
  const envApiKey = process.env.XAI_API_KEY;
  if (envApiKey) {
    return {
      supplier: {
        'brain.supplier.xai': {
          creds: async () => ({ XAI_API_KEY: envApiKey }),
        },
      },
    };
  }

  // attempt to get the key from keyrack via CLI
  // note: use ./node_modules/.bin/rhx to ensure correct resolution regardless of PATH
  try {
    const result = execSync(
      './node_modules/.bin/rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --org ehmpathy --json',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );

    // parse the JSON response
    const grant = JSON.parse(result.trim());

    // handle grant status
    if (grant.status === 'granted') {
      const apiKey = grant.grant.key.secret;

      // set in process.env for current rhachet compatibility
      process.env.XAI_API_KEY = apiKey;

      // return supplier for future compatibility when rhachet supports it
      return {
        supplier: {
          'brain.supplier.xai': {
            creds: async () => ({ XAI_API_KEY: apiKey }),
          },
        },
      };
    }

    // handle other statuses with fail-fast
    if (grant.status === 'locked') {
      console.error('');
      console.error('🦉 patience, friend');
      console.error('');
      console.error('✋ keyrack is locked');
      console.error('   ├─ owner: ehmpath');
      console.error(
        '   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env prep',
      );
      console.error('');
      process.exit(2);
    }

    if (grant.status === 'absent') {
      console.error('');
      console.error('🦉 patience, friend');
      console.error('');
      console.error('✋ XAI_API_KEY not found in keyrack');
      console.error('   ├─ owner: ehmpath');
      console.error(
        '   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY',
      );
      console.error('');
      process.exit(2);
    }

    if (grant.status === 'blocked') {
      console.error('');
      console.error('🦉 patience, friend');
      console.error('');
      console.error('✋ keyrack access blocked');
      console.error('   ├─ owner: ehmpath');
      console.error('   └─ hint: check keyrack permissions');
      console.error('');
      process.exit(2);
    }

    // unexpected status
    throw new Error(`unexpected grant status: ${JSON.stringify(grant)}`);
  } catch (error) {
    // propagate CLI stdout/stderr on failure
    if (error instanceof Error) {
      const execError = error as {
        stdout?: Buffer;
        stderr?: Buffer;
        status?: number;
      };
      if (execError.stdout) console.log(execError.stdout.toString());
      if (execError.stderr) console.error(execError.stderr.toString());
      // exit with CLI's exit code if available
      if (typeof execError.status === 'number') process.exit(execError.status);
    }
    throw error;
  }
};
