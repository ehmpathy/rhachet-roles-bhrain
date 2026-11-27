#!/usr/bin/env node
/**
 * .what = list every identity leak in the text files this branch changed
 * .why  = a tracked file ships to every clone and fork; a home dir, an email, or a
 *         transcript path names a person or a session
 * .note = read only. the host user ($USER) is checked by default; more names come via --also,
 *         so this file holds no real name
 */
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

// parse args
const args = process.argv.slice(2);
const flag = (name, fallback) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = flag('--base', 'origin/main');
const also = flag('--also', null);
if (also !== null && !also) {
  console.error('✋ ConstraintError: --also needs a regex of names');
  process.exit(2);
}

// gather the files this branch touched: committed vs base, staged, unstaged, untracked
const git = (argv) =>
  execFileSync('git', ['-c', 'core.quotepath=off', ...argv])
    .toString()
    .split('\n')
    .filter(Boolean);
const files = [
  ...new Set([
    ...git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]),
    ...git(['diff', '--name-only', '--diff-filter=ACMR', '--cached']),
    ...git(['diff', '--name-only', '--diff-filter=ACMR']),
    ...git(['ls-files', '--others', '--exclude-standard']),
  ]),
].filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());

// the shapes of a leak
const user = os.userInfo().username;
const SHAPES = [
  { kind: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)*\.[a-z]{2,}/g },
  { kind: 'home dir', re: /\/(?:home|Users)\/[A-Za-z0-9._-]+/g },
  { kind: 'transcript path', re: /-(?:home|Users)-[A-Za-z0-9._-]+-[A-Za-z0-9._-]+/g },
  { kind: 'host user', re: new RegExp(`\\b${user}\\b`, 'g') },
  ...(also ? [{ kind: 'name', re: new RegExp(also, 'gi') }] : []),
];

// matches that name no person: placeholder emails and placeholder home dirs
const SAFE_EMAIL = /@(example\.(com|org|net)|test\.com|users\.noreply\.github\.com)$|^noreply@/i;
const SAFE_HOME = /^\/(home|Users)\/(user|you|me|<[^>]*>)$/;

// sweep
const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file).toString();
  if (text.includes('\u0000')) continue;
  text.split('\n').forEach((line, idx) => {
    for (const { kind, re } of SHAPES) {
      for (const m of line.match(re) ?? []) {
        if (kind === 'email' && SAFE_EMAIL.test(m)) continue;
        if (kind === 'home dir' && SAFE_HOME.test(m)) continue;
        if (kind === 'transcript path' && /^-(home|Users)-user-/.test(m)) continue;
        hits.push(`${file}:${idx + 1}: ${kind}: ${m}`);
      }
    }
  });
}

// report
console.log(`🦉 ${hits.length ? 'ears up' : 'so it is, clean'}`);
console.log('');
console.log(`🔍 doxxers.scan --base ${base}${also ? ' --also <names>' : ''}`);
console.log(`   ├─ files scanned: ${files.length}`);
console.log(`   └─ leaks found: ${hits.length}`);
hits.forEach((h, i) => console.log(`      ${i === hits.length - 1 ? '└─' : '├─'} ${h}`));
process.exit(hits.length ? 2 : 0);
