import { asGuardBindNarrowLever } from './asGuardBindNarrowLever';
import {
  asGuardMalfunctionParts,
  type GuardMalfunctionPart,
} from './asGuardMalfunctionParts';
import { asRouteStoneSetCommandHead } from './review/peer/asRouteStoneSetCommandHead';

/**
 * .what = the escalation a malfunction owes: a human, only for a grant the driver cannot make
 * .why = a cause the classes do not know may be a credential or a permission, and the driver must
 *        still see where that case goes — else a malfunction halt names no human at all
 */
const GUARD_MALFUNCTION_ESCALATION = `ask a human only for a grant you cannot make (an absent credential, a permission, etc)`;

/**
 * .what = the one fix a cause class names for its part, or null where the shared steps suffice
 * .why = only a glob and a credential carry a remedy of their own. a transient, unreadable, or
 *        unknown cause clears with the shared read and re-arrive, so its part shows its cause alone
 */
const asFixOfPart = (input: {
  stone: string;
  part: GuardMalfunctionPart;
}): string | null => {
  // a bad glob → narrow the lane in the guard
  if (input.part.causeKind === 'glob') {
    const narrow = asGuardBindNarrowLever({ stone: input.stone });
    return `narrow ${narrow.fields}, in $route/${input.stone}.guard`;
  }

  // an absent credential or permission → the one case a human must grant
  if (input.part.causeKind === 'credential')
    return `ask a human for the grant the cause names`;

  // all else clears with the shared steps
  return null;
};

/**
 * .what = renders one broken part — its cause, and its own fix where it has one
 * .why = a part shows only what is unique to it; the steps it shares with its peers render once
 */
const asPartLines = (input: {
  stone: string;
  part: GuardMalfunctionPart;
  indent: string;
}): string[] => {
  const fix = asFixOfPart(input);
  return [
    `${input.indent}├─ 💥 ${input.part.label} broke`,
    `${input.indent}│  ${fix ? '├─' : '└─'} cause = ${input.part.cause} (${input.part.causeKind})`,
    ...(fix ? [`${input.indent}│  └─ fix = ${fix}`] : []),
  ];
};

/**
 * .what = one step of the shared `next` — its text, and the commands that perform it
 */
type GuardMalfunctionNextStep = { step: string; commands: string[] };

/**
 * .what = renders, as tree lines, one row per broken part of a guard — its cause and its own
 *         fix — then ONE `next` whose steps run in the order the gates accept them
 * .why = a malfunction halts the stone yet stays the DRIVER's to clear
 *        (rule.always.diagnose-reviewer-malfunctions). the rows read the persisted reason, so
 *        every surface that shows a malfunction (the guard tree, the stone.set emit, the
 *        route.drive replay) names the same parts with the same remedies
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = the steps are shared, never per part: one re-arrive clears every part, and the
 *         answer and the escalation read the same for each. the order is the order the gates
 *         accept — the entrance gate refuses a re-arrive while a lane still owes a `.taken`, so
 *         the answer precedes the re-arrive
 * .note = a judge writes no given, so it owes no answer; the answer step names each broken
 *         lane's command, and drops out where only judges broke
 * .note = no overflow row: an overflow is a refusal (`ReviewOverflowRefusedError`, exit 2),
 *         which the guard classes `constraint`, never `malfunction`
 */
export const formatGuardMalfunctionLeverLines = (input: {
  stone: string;
  reason: string | null;
  indent: string;
}): string[] => {
  const parts = asGuardMalfunctionParts({ reason: input.reason });
  const head = asRouteStoneSetCommandHead({ stone: input.stone });

  // one row per broken part: what broke, its cause, its own fix
  const partLines = parts.flatMap((part) =>
    asPartLines({ stone: input.stone, part, indent: input.indent }),
  );

  // the lanes that owe an answer. a record that names no parts (it predates the lanes) may
  // still hold a broken lane, so it keeps the step with no command it cannot name
  const lanes = parts.flatMap((part) => (part.slug ? [part.slug] : []));
  const owesAnswer = parts.length === 0 || lanes.length > 0;

  // the shared steps, in the order the gates accept them
  const steps: GuardMalfunctionNextStep[] = [
    {
      step: `read each given for its cause, and fix what you can`,
      commands: [],
    },
    ...(owesAnswer
      ? [
          {
            step: `answer each broken lane, like a rejected one`,
            commands: lanes.map(
              (slug) => `${head} --as absorbed --that ${slug}`,
            ),
          },
        ]
      : []),
    { step: `re-arrive`, commands: [`${head} --as arrived`] },
  ];

  // number each step; the escalation is a peer of them, never one of the sequence
  const stepLines = steps.flatMap((one, index) => [
    `${input.indent}   ├─ ${index + 1}. ${one.step}`,
    ...one.commands.map(
      (command, at) =>
        `${input.indent}   │  ${at === one.commands.length - 1 ? '└─' : '├─'} ${command}`,
    ),
  ]);

  return [
    ...partLines,
    `${input.indent}└─ next`,
    ...stepLines,
    `${input.indent}   └─ ${GUARD_MALFUNCTION_ESCALATION}`,
  ];
};
