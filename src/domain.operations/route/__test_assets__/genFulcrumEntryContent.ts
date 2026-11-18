/**
 * .what = the concerns the dispute suites cite, as fulcrum holds
 * .why = a dispute may only cite a fulcrum that holds the concern it backs; the shared fixture
 *        holds every concern its suites dispute, so a case opts out only when it tests that refusal
 */
const HOLDS_DEFAULT = [
  'limited/i001/blocker.1',
  'limited/i001/blocker.2',
  'limited/i001/blocker.9',
  'limited/i001/nitpick.1',
  'friendly/i001/nitpick.1',
];

/**
 * .what = the body of a fulcrum entry with valid frontmatter, for a test fixture
 * .why = the dispute path refuses a fulcrum whose frontmatter is absent or invalid, so every
 *        fixture a dispute cites must carry one; one generator keeps them all in step
 *
 * .note = `case` takes the file's case segment (`F001-test`); the frontmatter holds its id
 *         (`F001`), since a case that differs from the file id reads as unreadable
 */
export const genFulcrumEntryContent = (input: {
  case: string;
  ground?: 'wrong' | 'dirty';
  confidence?: number;
  owed?: 'human' | 'reflect' | 'none';
  reflect?: string | null;
  holds?: string[];
}): string => {
  const [id] = input.case.split('-');
  return [
    `---`,
    `case: ${id}`,
    `rework: clean`,
    `ground: ${input.ground ?? 'wrong'}`,
    `confidence: ${input.confidence ?? 0.65}`,
    `status: open`,
    `owed: ${input.owed ?? 'human'}`,
    `holds: [${(input.holds ?? HOLDS_DEFAULT).join(', ')}]`,
    `lean: x`,
    ...(input.reflect ? [`reflect: ${input.reflect}`] : []),
    `verdict: null`,
    `---`,
    ``,
    `# ${input.case} — the argument the council reads`,
    ``,
  ].join('\n');
};
