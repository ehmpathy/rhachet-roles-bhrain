#!/usr/bin/env node
// .what = census the symlink coverage between the flat `.dream/` queue and one
//         route's `dreams/` dir. reports three counts and names every gap.
//
// .why  = `rule.always.catch-dreams-for-followups` makes the symlink a BLOCKER:
//         a dream dropped in the flat queue with no link at the route that found
//         it leaves the round unrecorded — a reader of the route cannot see what
//         it deferred, and a reader of the dream cannot see what was underway.
//         ⇒ and the rule's own cue table says a route that ends with an empty
//           `dreams/` is suspicious, so the check is owed at every arrival.
//
//         the gap is INVISIBLE to every tool a driver reaches for by reflex.
//         `git status` lists a symlink and a regular file identically, and a
//         `Glob` of either dir alone reports what IS there and can never report
//         what is absent (`hazard.a-status-read-cannot-report-absence`). two
//         listings must be DIFFED, and a diff at the prompt is an unnamed tool.
//         ⇒ this is that tool, named.
//
// 🔴 .bound = `.dream/` is REPO-WIDE, so an unlinked dream is NOT a defect on its
//         own. a route owes a link only for what IT caught, and the filesystem
//         cannot say which route caught which dream — the symlink IS that record,
//         so a census of the queue cannot derive the very fact it grades.
//         ⇒ `unlinked` is reported as INFORMATION and never gates.
//
//         ⚠️ this was measured, never assumed. the first run of this tool reported
//           74 unlinked against one route and exited 2. every one of the 74 was
//           caught by an earlier route — the tool's premise was wrong, and its own
//           output is what refuted it (`rule.require.trust-but-verify`). the gate
//           was then narrowed to the two classes that ARE defects on any premise.
//
// .note = `--since` narrows the unlinked report to the window a route ran, which
//         is the closest a filesystem read gets to "what this route caught". it is
//         a LOWER BOUND and says so on the row — a concurrent route catches dreams
//         in the same window, so a name in that list is a candidate to read, never
//         a violation to fix.
//
// usage:
//   rhx census.dreams --route .behavior/v2026_09_09.feat-prescribed-brain-per-stone
//   rhx census.dreams --route <path> --since v2026_09_09
//   rhx census.dreams --route <path> --queue .dream
//
// exit: 0 when no link dangles and none is broken; 2 otherwise (a CONSTRAINT the
//       driver must fix, per `rule.require.exit-code-semantics`). an unlinked
//       dream never changes the exit code — see the bound above.

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const readFlag = (name) => {
  const at = argv.indexOf(name);
  return at !== -1 && argv[at + 1] ? argv[at + 1] : null;
};

const route = readFlag('--route');
const queue = readFlag('--queue') || '.dream';
const since = readFlag('--since');

if (!route) {
  console.error('usage: --route <path-to-route> [--queue .dream]');
  process.exit(1);
}

const dreamsAt = path.join(route, 'dreams');

// read a dir into a name set, treating an absent dir as empty rather than fatal —
// an absent `dreams/` is itself a finding this census must report, never a crash.
const asNames = (dir) => {
  if (!fs.existsSync(dir)) return { present: false, names: [] };
  return {
    present: true,
    names: fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.md') && !name.startsWith('.')),
  };
};

const inQueue = asNames(queue);
const atRoute = asNames(dreamsAt);

if (!inQueue.present) {
  console.error(`the dream queue is absent at ${queue}`);
  process.exit(1);
}

const atRouteSet = new Set(atRoute.names);
const inQueueSet = new Set(inQueue.names);

// the `v$date` prefix a dream filename carries is the date it was CAUGHT, so a
// lexical compare against `--since` narrows to the window this route ran. it is a
// lower bound — a concurrent route catches into the same window — so it narrows a
// report and never a gate.
const unlinked = inQueue.names
  .filter((name) => !atRouteSet.has(name))
  .filter((name) => (since ? name >= since : true));
const dangling = atRoute.names.filter((name) => !inQueueSet.has(name));

// a third failure, distinct from `dangling`: the name matches a dream in the
// queue, and the link itself does not reach a file — a bad relative target.
const broken = atRoute.names.filter((name) => {
  const at = path.join(dreamsAt, name);
  try {
    fs.statSync(at);
    return false;
  } catch {
    return true;
  }
});

console.log('');
console.log('🦉 census.dreams');
console.log(`   ├─ queue: ${queue}`);
console.log(`   ├─ route: ${dreamsAt}${atRoute.present ? '' : '   ⚠️ absent'}`);
console.log(`   ├─ since: ${since || '—   ⚠️ the whole repo-wide queue'}`);
console.log('   ├─ quant');
console.log(`   │  ├─ dreams in queue = ${inQueue.names.length}`);
console.log(`   │  ├─ links at route  = ${atRoute.names.length}`);
console.log(`   │  ├─ dangling        = ${dangling.length}   ⟨gates⟩`);
console.log(`   │  ├─ broken          = ${broken.length}   ⟨gates⟩`);
console.log(
  `   │  └─ unlinked        = ${unlinked.length}   ⟨reports only — the queue is repo-wide⟩`,
);

const report = (title, names) => {
  if (names.length === 0) return;
  console.log(`   ├─ ${title}`);
  for (const name of names) console.log(`   │  ├─ ${name}`);
};

report('🔴 dangling — a link at this route with no dream behind it', dangling);
report('🔴 broken — a link whose target does not reach a file', broken);
report(
  `🟡 unlinked — in the queue, unlinked here. a LOWER BOUND on what other routes caught,` +
    ` never a violation list. read each; link only the ones THIS route found`,
  unlinked,
);

if (unlinked.length > 0) {
  console.log('   ├─ to link one this route did catch —');
  console.log(
    `   │  rhx symlink --at "${dreamsAt}/<dream>.md" --to "${queue}/<dream>.md" --mode relative --idem findsert`,
  );
}

const clean = dangling.length === 0 && broken.length === 0;

if (clean) {
  console.log('   └─ ✨ every link at this route reaches a dream');
  console.log('');
  process.exit(0);
}

console.log('   └─ ✋ a link at this route points at no dream — fix, then re-run');
console.log('');
process.exit(2);
