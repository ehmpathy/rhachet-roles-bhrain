// .what = the files a set of globs names, sorted and deduped; a set that names no file fails loud
//
// .why  = the census and moveout skills each expand a --glob. one helper, so a `**` glob works
//         the same in all of them, and a typo'd glob halts rather than report "0" as a clean result
//
// .note = a library, not a skill: it has no `.sh`, so rhx never resolves it. node_modules is never
//         walked. symlinks to files are returned; a caller that must skip them checks lstat
const fs = require('fs');
const globby = require('globby');

const getAllFilesFromGlobs = (input) => {
  const files = [
    ...new Set(
      globby.sync(input.globs, { ignore: ['**/node_modules/**'], dot: true }),
    ),
  ]
    .filter((file) => fs.existsSync(file))
    .sort();

  // a glob set that names no file is a typo, never a clean zero
  if (files.length === 0) {
    console.error(`✋ ConstraintError: ${input.skill}: no file matched the --glob set`);
    input.globs.forEach((glob) => console.error(`   ├─ --glob ${glob}`));
    console.error('   └─ check the pattern; quote it so the shell does not expand it');
    process.exit(2);
  }
  return files;
};

module.exports = { getAllFilesFromGlobs };
