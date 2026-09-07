#!/usr/bin/env node
/**
 * .what = checks a role readme's canon table against the rules its `boot.yml`
 *         actually loads — in BOTH directions.
 *
 * .why  = `telepath/readme.md` carries a section headed *"the canon, declared
 *         ONCE here"*. on 2026-09-05 it named 10 of 18 booted rules, and every
 *         absent one was a clamp — the half `S23` asked for.
 *
 *         that is `declare-once` (#425) in its worst shape, and the round-13
 *         note in the learner's progress file names why:
 *
 *           a count that DISAGREES with its source — a careful re-read catches it
 *           an enumeration with a STRUCK member — the gap shows
 *           an enumeration that silently STOPPED  — only a check against DISK
 *
 *         the readme was in the third class. it was internally consistent, read
 *         as authoritative, and was incomplete — so no re-read of it could ever
 *         have found the defect. only the boot file settles it.
 *
 * ⇒ `rule.forbid.itemization-without-coordinates` already said so — *"the gap
 *   check is a Glob, not a read."* the affordance was stated and no instrument
 *   ran it. this is that instrument.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.canon.table-complete.js [role]
 * writes = never
 */
const fs = require('fs');

const role = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'telepath';
const dir = `src/domain.roles/${role}`;
const boot = fs.readFileSync(`${dir}/boot.yml`, 'utf8');
const readme = fs.readFileSync(`${dir}/readme.md`, 'utf8');

// an entry line only — a rule cited in a comment does not boot.
//
// - each tier comment cites its peers and its foreign parents by name
// - a loose match counts every citation as booted
//   - ⇒ then demands a readme row for a rule this role does not carry
const ENTRY = /^\s*-\s+briefs\/rule\.((?:forbid|require|always|prefer|avoid)\.[a-z0-9-]+)/gm;

const booted = [...new Set([...boot.matchAll(ENTRY)].map((m) => m[1]))].sort();

// a readme names a rule in a backtick span, with the `rule.` prefix dropped —
// `require.purpose-first`. the prefix is dropped because the table's own column
// already says these are rules, so to repeat it on 18 rows is 18 dead tokens.
const NAMED = /`((?:forbid|require|always|prefer|avoid)\.[a-z0-9-]+)`/g;
const named = [...new Set([...readme.matchAll(NAMED)].map((m) => m[1]))].sort();

const absent = booted.filter((r) => !named.includes(r));

// 🟡 the REVERSE direction matters as much, and it is the one a completeness
//    check usually omits. a rule named in the table and absent from `boot.yml`
//    is a PHANTOM PATH — `rule.always.reuse-pavement-before-improvise` grades it
//    a blocker, since a citation carries a pointer's authority whether or not a
//    file sits behind it.
//
// 🟡 but that same rule declares the phantom's TWIN, which greps identically and
//    is no defect: a FOREIGN artifact, one that lives in a peer repo. it is
//    legitimate "and only if MARKED" — and the cost of an unmarked one falls on
//    the READER, who globs, finds naught, and cannot tell a lost file from a
//    distant one.
//
// ⇒ so the check is not "does it exist here"; it is "does the prose say where it
//   lives". a name inside a passage that cites another repo is marked, and the
//   `lang.prose/` migration list under `.provenance` is exactly that case.
const FOREIGN_MARK = /\bin `?(ehmpathy|bhuild|bhrain)`?'s|\((?:ehmpathy|bhuild|bhrain)\/[a-z]+\)/;
const foreignBlocks = readme
  .split(/\n(?=#{2,4}\s)/)
  .filter((block) => FOREIGN_MARK.test(block));
const isForeign = (rule) => foreignBlocks.some((b) => b.includes(rule));

const phantom = named.filter((r) => !booted.includes(r) && !isForeign(r));
const foreign = named.filter((r) => !booted.includes(r) && isForeign(r));

console.log(`role=${role}  booted=${booted.length}  named=${named.length}`);
console.log('');

if (absent.length) {
  console.log(`ABSENT — booted, and the canon table does not name them (${absent.length}):`);
  for (const r of absent) console.log(`   ${r}`);
  console.log('');
}

if (phantom.length) {
  console.log(`PHANTOM — named in the table, and boot.yml does not load them (${phantom.length}):`);
  for (const r of phantom) console.log(`   ${r}`);
  console.log('');
}

const words = readme.split(/\s+/).filter(Boolean).length;
const tail = `readme ${words} words · ${foreign.length} foreign, marked`;
console.log(
  absent.length || phantom.length
    ? `${absent.length} absent · ${phantom.length} phantom · ${tail}`
    : `complete in both directions · ${tail}`,
);
