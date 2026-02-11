import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { setResearchBind } from './setResearchBind';

const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * .what = initializes a research directory with thoughtroute templates
 * .why = enables systematic research via structured phases
 */
export const initResearchDir = async (input: {
  name: string;
  dir?: string;
}): Promise<{
  researchDir: string;
  created: string[];
  kept: string[];
  flagPath: string;
  branchName: string;
}> => {
  const cwd = input.dir ?? process.cwd();

  // compute research directory name with iso date
  const isoDate = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const researchDirName = `v${isoDate}.${input.name}`;
  const researchDir = path.join(cwd, '.research', researchDirName);

  // check if research directory already found
  const researchDirAbsolute = path.resolve(researchDir);
  try {
    await fs.access(researchDirAbsolute);

    // check if it has a .bind already (means it was created)
    const bindDir = path.join(researchDirAbsolute, '.bind');
    try {
      await fs.access(bindDir);
      // already initialized → check if same branch
      const bindResult = await setResearchBind({
        researchDir: researchDirAbsolute,
        cwd,
      });
      return {
        researchDir: path.relative(cwd, researchDirAbsolute) || '.',
        created: [],
        kept: [],
        flagPath: bindResult.flagPath,
        branchName: bindResult.branchName,
      };
    } catch {
      // .bind doesn't exist, but dir does — this is unusual
      // proceed with initialization
    }
  } catch {
    // directory doesn't exist — this is the expected case for new research
  }

  // validate name format
  if (!/^[a-z0-9-]+$/.test(input.name))
    throw new BadRequestError(
      'research name must be lowercase alphanumeric with hyphens only',
      { name: input.name },
    );

  // create research directory
  await fs.mkdir(researchDirAbsolute, { recursive: true });

  // enumerate template files
  const templateFiles = await enumFilesFromGlob({
    glob: '**/*',
    cwd: TEMPLATES_DIR,
  });

  const created: string[] = [];
  const kept: string[] = [];

  // compute relative path for variable substitution
  const researchDirRel = path.relative(cwd, researchDirAbsolute);

  // findsert each template
  for (const templateFileAbsolute of templateFiles) {
    // enumFilesFromGlob returns absolute paths; convert to relative for target path
    const templateFileRel = path.relative(TEMPLATES_DIR, templateFileAbsolute);
    const targetPath = path.join(researchDirAbsolute, templateFileRel);
    const targetDir = path.dirname(targetPath);

    // ensure parent directory found
    await fs.mkdir(targetDir, { recursive: true });

    // check if target found
    try {
      await fs.access(targetPath);
      kept.push(templateFileRel);
      continue;
    } catch {
      // file doesn't exist — create it
    }

    // read template and substitute variables
    let content = await fs.readFile(templateFileAbsolute, 'utf-8');

    // substitute $RESEARCH_DIR_REL
    content = content.replace(/\$RESEARCH_DIR_REL/g, researchDirRel);

    // write file
    await fs.writeFile(targetPath, content);
    created.push(templateFileRel);
  }

  // bind research to current branch
  const bindResult = await setResearchBind({
    researchDir: researchDirAbsolute,
    cwd,
  });

  return {
    researchDir: researchDirRel || '.',
    created,
    kept,
    flagPath: bindResult.flagPath,
    branchName: bindResult.branchName,
  };
};
