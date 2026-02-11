import { execSync } from 'child_process';
import { basename, join, relative } from 'path';

import { initResearchDir } from '@src/domain.operations/research/init/initResearchDir';
import { computeBindOutput } from '@src/domain.operations/research/render/computeBindOutput';
import { computeFooterOutput } from '@src/domain.operations/research/render/computeFooterOutput';
import { computeOutputTree } from '@src/domain.operations/research/render/computeOutputTree';

/**
 * .what = cli entrypoint for init.research skill
 * .why = enables shell invocation via package-level import
 */
export const researchInit = async (): Promise<void> => {
  // detect argv offset: in node -e mode, args start at index 1 (no entrypoint path)
  // detect by checking if argv[1] looks like a flag rather than a file path
  const firstArgIsFlag =
    process.argv[1]?.startsWith('--') || process.argv[1]?.startsWith('-');
  const argvOffset = firstArgIsFlag ? 1 : 2;

  const args = process.argv.slice(argvOffset);

  // check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
usage: init.research --name <name> [--dir <directory>] [--open <editor>]

options:
  --name <name>     research topic slug (required)
  --dir <directory> target directory (default: cwd)
  --open <editor>   open wish file in specified editor after init

examples:
  init.research --name consensus-algorithms
  init.research --name ddd-patterns --dir /path/to/project
  init.research --name supply-chain --open cursor
`);
    process.exit(0);
  }

  // parse args
  let name: string | null = null;
  let dir: string | undefined;
  let openEditor: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && args[i + 1]) {
      name = args[++i]!;
    } else if (arg === '--dir' && args[i + 1]) {
      dir = args[++i];
    } else if (arg === '--open' && args[i + 1]) {
      openEditor = args[++i];
    }
  }

  // validate required args before expensive imports
  if (!name) {
    console.error('⛈️  error: --name is required');
    process.exit(1);
  }

  // validate --open has a value if provided
  if (openEditor !== undefined && openEditor.trim() === '') {
    console.error('⛈️  error: --open requires an editor name');
    console.error('');
    console.error('please specify what editor to open with. for example:');
    console.error('  --open codium');
    console.error('  --open vim');
    console.error('  --open zed');
    console.error('  --open code');
    process.exit(1);
  }

  // run the init
  const result = await initResearchDir({ name, dir });

  // render tree-style output
  const treeOutput = computeOutputTree({
    created: result.created,
    kept: result.kept,
    updated: [],
  });
  console.log(treeOutput);

  // compute relative path to wish file from cwd
  const wishPathRel = relative(
    process.cwd(),
    join(result.researchDir, '0.wish.md'),
  );

  // try opener if --open is provided (before footer render)
  let openerUsed: string | undefined;
  if (openEditor) {
    try {
      execSync(`${openEditor} "${wishPathRel}"`, { stdio: 'inherit' });
      openerUsed = openEditor;
    } catch {
      console.log('');
      console.log(`⚠️  failed to open ${wishPathRel} in ${openEditor}`);
    }
  }

  // render footer with wish path (and opener if successful)
  console.log('');
  const footerOutput = computeFooterOutput({ wishPathRel, opener: openerUsed });
  console.log(footerOutput);

  // extract research name from directory for bind output
  const researchDirName = basename(result.researchDir);
  const branchName = result.branchName;

  // log branch bind confirmation
  console.log('');
  const bindOutput = computeBindOutput({
    branchName,
    researchName: researchDirName,
  });
  console.log(bindOutput);
};
