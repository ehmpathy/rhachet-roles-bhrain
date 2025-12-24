import { execSync } from 'child_process';

import { getGitRemoteUrl } from './getGitRemoteUrl';

/**
 * .what = constructs github url for a file in a git repository
 * .why = enables permanent citations with provenance track
 */
export const genGitHubFileUrl = (input: {
  filePath: string;
  cwd: string;
  ref?: string;
}): string => {
  // get remote url and parse to github format
  const remoteUrl = getGitRemoteUrl({ cwd: input.cwd });
  const githubBase = parseRemoteToGitHubUrl(remoteUrl);

  // get current branch or commit if ref not specified
  const ref =
    input.ref ??
    execSync('git rev-parse HEAD', {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

  // encode file path for url (handle special characters like brackets)
  const encodedPath = encodeFilePath(input.filePath);

  return `${githubBase}/blob/${ref}/${encodedPath}`;
};

/**
 * .what = parses git remote url to github https url
 * .why = handles both ssh and https remote formats
 */
const parseRemoteToGitHubUrl = (remoteUrl: string): string => {
  // ssh format: git@github.com:org/repo.git
  const sshMatch = remoteUrl.match(/git@github\.com:(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}`;
  }

  // https format: https://github.com/org/repo.git
  const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return `https://github.com/${httpsMatch[1]}`;
  }

  // fallback: strip .git suffix if present
  return remoteUrl.replace(/\.git$/, '');
};

/**
 * .what = encodes file path for github url
 * .why = handles special characters like brackets in filenames
 */
const encodeFilePath = (filePath: string): string => {
  // encode special characters that github expects encoded
  return filePath
    .split('/')
    .map((segment) =>
      segment.replace(/\[/g, '%5B').replace(/\]/g, '%5D').replace(/ /g, '%20'),
    )
    .join('/');
};
