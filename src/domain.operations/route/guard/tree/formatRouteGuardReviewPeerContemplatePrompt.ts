/**
 * .what = one reviewer's identity + verdict + the two conversation paths
 * .why = every render case needs the same per-reviewer facts
 */
type ContemplateReviewer = {
  slug: string;
  blockers: number;
  nitpicks: number;
  pathGiven: string;
  pathTaken: string;
};

/**
 * .what = renders "N blockers, M nitpicks" with correct singular/plural
 * .why = the verdict line appears in every case, so pluralize once
 */
const asVerdict = (input: { blockers: number; nitpicks: number }): string => {
  const blockersLabel = input.blockers === 1 ? 'blocker' : 'blockers';
  const nitpicksLabel = input.nitpicks === 1 ? 'nitpick' : 'nitpicks';
  return `${input.blockers} ${blockersLabel}, ${input.nitpicks} ${nitpicksLabel}`;
};

/**
 * .what = renders the peer-review contemplation prompt across its three cases
 * .why = one formatter, one voice — the reply-prompt (all uncontemplated
 *        reviewers, rendered identically on stophook/arrived/passed), the ABSENT
 *        guidance (a .taken never written), and the STALE guidance (a .taken
 *        written for a prior iteration hash). the absent/stale cases scope to the
 *        single reviewer the driver named via --as contemplated --that <slug>.
 */
export const formatRouteGuardReviewPeerContemplatePrompt = (
  input:
    | { case: 'reply-prompt'; stone: string; reviewers: ContemplateReviewer[] }
    | { case: 'absent'; stone: string; reviewer: ContemplateReviewer }
    | { case: 'stale'; stone: string; reviewer: ContemplateReviewer },
): string => {
  // the multi-reviewer reply-prompt — shown identically across all three surfaces
  if (input.case === 'reply-prompt') return formatReplyPrompt(input);

  // the single-reviewer absent guidance — the .taken was never written
  if (input.case === 'absent') return formatAbsent(input);

  // the single-reviewer stale guidance — the .taken answers a prior generation
  return formatStale(input);
};

/**
 * .what = the "reviewers await your reply" list of every uncontemplated reviewer
 * .why = the driver sees each reviewer, its verdict, and where to read + write
 */
const formatReplyPrompt = (input: {
  stone: string;
  reviewers: ContemplateReviewer[];
}): string => {
  const lines: string[] = [];
  const total = input.reviewers.length;

  lines.push(`🦉 the reviewers await your reply`);
  lines.push(``);
  lines.push(`🌕 lets respond`);
  lines.push(`   │`);

  input.reviewers.forEach((reviewer, i) => {
    lines.push(`   ├─ review.peer ${i + 1}/${total}`);
    lines.push(`   │  ├─ slug = ${reviewer.slug}`);
    lines.push(`   │  ├─ verdict = ${asVerdict(reviewer)}`);
    lines.push(`   │  ├─ contemplate from`);
    lines.push(`   │  │  └─ ${reviewer.pathGiven}`);
    lines.push(`   │  └─ articulate into`);
    lines.push(`   │     └─ ${reviewer.pathTaken}`);
    lines.push(`   │`);
  });

  const firstSlug = input.reviewers[0]?.slug ?? '<slug>';
  lines.push(`   └─ when you've contemplated each reviewer, run`);
  lines.push(
    `      └─ rhx route.stone.set --stone ${input.stone} --as contemplated --that ${firstSlug}`,
  );

  return lines.join('\n');
};

/**
 * .what = the crystal-clear absent-file guidance for one reviewer
 * .why = the driver signaled --as contemplated before the .taken existed
 */
const formatAbsent = (input: {
  stone: string;
  reviewer: ContemplateReviewer;
}): string => {
  const lines: string[] = [];

  lines.push(`✋ contemplation absent for reviewer ${input.reviewer.slug}`);
  lines.push(``);
  lines.push(
    `   the guard looked for your response here, and did not find it:`,
  );
  lines.push(`   └─ ${input.reviewer.pathTaken}`);
  lines.push(``);
  lines.push(
    `   why: --as contemplated is a promise that you engaged each critique.`,
  );
  lines.push(
    `        the .taken file IS that engagement — absent it, there is`,
  );
  lines.push(`        no ground to stand on.`);
  lines.push(``);
  lines.push(`   what to do:`);
  lines.push(`   ├─ contemplate from`);
  lines.push(`   │  └─ ${input.reviewer.pathGiven}`);
  lines.push(`   └─ articulate into`);
  lines.push(`      └─ ${input.reviewer.pathTaken}`);

  return lines.join('\n');
};

/**
 * .what = the stale-file guidance for one reviewer
 * .why = a .taken exists, but at a prior iteration hash — the artifact changed,
 *        so the critique re-ran and a fresh response is owed
 */
const formatStale = (input: {
  stone: string;
  reviewer: ContemplateReviewer;
}): string => {
  const lines: string[] = [];

  lines.push(`✋ contemplation stale for reviewer ${input.reviewer.slug}`);
  lines.push(``);
  lines.push(`   your response answers a prior generation of this critique.`);
  lines.push(``);
  lines.push(
    `   why: the stone artifact changed, so the reviewer re-ran at a new`,
  );
  lines.push(`        hash. a fresh critique needs a fresh response.`);
  lines.push(``);
  lines.push(`   what to do — re-articulate for the current iteration:`);
  lines.push(`   ├─ contemplate from`);
  lines.push(`   │  └─ ${input.reviewer.pathGiven}`);
  lines.push(`   └─ articulate into`);
  lines.push(`      └─ ${input.reviewer.pathTaken}`);

  return lines.join('\n');
};
