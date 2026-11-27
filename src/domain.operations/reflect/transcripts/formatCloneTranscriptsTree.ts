import type { CloneTranscript } from './getAllCloneTranscripts';

/**
 * .what = a prompt as one short line
 * .why = a prompt can span many lines; a leaf holds one, so a human can scan the list
 */
const asPromptSnippet = (input: { text: string }): string => {
  const flat = input.text.replace(/\s+/g, ' ').trim();
  return flat.length > 80 ? `${flat.slice(0, 77)}...` : flat;
};

/**
 * .what = a byte count in human units
 */
const asSizeLabel = (input: { bytes: number }): string =>
  input.bytes >= 1_048_576
    ? `${(input.bytes / 1_048_576).toFixed(1)}MB`
    : `${Math.ceil(input.bytes / 1024)}KB`;

/**
 * .what = the leaves of one transcript's branch
 * .why = the resume command carries `CLAUDE_CONFIG_DIR`: one session id can sit under two
 *        actors after a fork, and a bare `claude --resume` opens whichever its own config
 *        dir holds
 */
const asTranscriptLeaves = (input: {
  transcript: CloneTranscript;
  isScopeAll: boolean;
}): string[] => {
  const { transcript } = input;
  const stats = transcript.stats;
  const facts = transcript.fault
    ? [`fault: ${transcript.fault}`]
    : [
        stats?.promptLast
          ? `prompt last: ${stats.promptLast.at} · "${asPromptSnippet({ text: stats.promptLast.text })}"`
          : 'prompt last: none',
        `activity: ${stats?.since ?? '?'} → ${stats?.until ?? '?'}`,
        `size: ${stats?.prompts ?? 0} prompts · ${stats?.entries ?? 0} entries · ${asSizeLabel({ bytes: transcript.bytes })}`,
      ];
  return [
    `actor: ${transcript.actor}`,
    ...(input.isScopeAll ? [`tree: ${transcript.slug}`] : []),
    ...facts,
    `resume: CLAUDE_CONFIG_DIR='${transcript.configDir}' claude --resume ${transcript.session}`,
  ];
};

/**
 * .what = renders the ranked transcripts as a tree, newest human prompt first
 * .why = a human reads one list to find the session they spoke to, and copies its resume line
 */
export const formatCloneTranscriptsTree = (input: {
  shown: CloneTranscript[];
  hiddenBelowMinPrompts: number;
  hiddenPastLimit: number;
  scope: 'tree' | 'all';
  minPrompts: number;
  session: string | null;
}): string => {
  const isScopeAll = input.scope === 'all';
  const head = [
    '🦉 who spoke last?',
    '',
    '🌕 reflect.on.transcripts',
    `   ├─ scope: ${isScopeAll ? 'every tree' : 'this tree'}${input.session ? `, session ${input.session}*` : ''}`,
    `   ├─ shown: ${input.shown.length}`,
    `   ├─ hidden: ${input.hiddenBelowMinPrompts} under ${input.minPrompts} prompts · ${input.hiddenPastLimit} past the limit`,
  ];
  if (input.shown.length === 0)
    return [
      ...head,
      '   └─ no session found',
      '      └─ widen with --all, or lower --min-prompts',
      '',
    ].join('\n');

  const branches = input.shown.flatMap((transcript, index) => {
    const isLast = index === input.shown.length - 1;
    const stem = isLast ? '         ' : '      │  ';
    const leaves = asTranscriptLeaves({ transcript, isScopeAll });
    return [
      `${isLast ? '      └─ ' : '      ├─ '}${transcript.session}`,
      ...leaves.map(
        (leaf, leafIndex) =>
          `${stem}${leafIndex === leaves.length - 1 ? '└─ ' : '├─ '}${leaf}`,
      ),
      ...(isLast ? [] : ['      │']),
    ];
  });
  return [
    ...head,
    '   └─ sessions, newest human prompt first',
    ...branches,
    '',
  ].join('\n');
};
