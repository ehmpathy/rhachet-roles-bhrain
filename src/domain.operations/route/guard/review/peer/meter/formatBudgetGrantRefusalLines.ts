import { asUrgentHarmSet } from '../../../../asUrgentHarmSet';
import { asMeterCountDisplay } from '../../../asMeterCountDisplay';
import { getGuardStoneNames } from '../../../getGuardStoneNames';
import { formatReviewBudgetTopupCommand } from '../formatReviewBudgetTopupCommand';
import { asGuardBudgetHeadLines } from './asGuardBudgetHeadLines';
import type {
  BudgetGrantMeter,
  BudgetGrantRefusal,
} from './computeBudgetGrantRefusal';
import { hasReviewerRunDry } from './computeBudgetGrantRefusal';

/**
 * .what = one meter, as the refusal names its SPEND — `mech-rules = 3/8 rounds spent — 5 left`
 * .why = the refusal's diagnosis is the branch condition made visible. a driver that reads
 *        `3/8 rounds spent` beside `rounds remain` can check the gate rather than trust it.
 *
 * 🔴 .this reports SPEND against the allowance; the ack's `asReviewerMeterLine` reports a
 *    reviewer's STANDING (`mechanic (l1), 2 rounds, 4 budget — 2 rounds left`). they are two
 *    concepts, and they carry two names.
 *
 * ⚠️ .they are NOT one renderer with two shapes, and the outputs prove it: they differ in FIELDS
 *    (this one names no level) and they diverge on an unlimited budget (`rounds spent, budget
 *    unlimited` here, `∞ rounds left` there). ⇒ two renders that disagree for one input are two
 *    concepts, so each carries its own name. to force them into one parameterized renderer would
 *    need a switch on which sentence to build, which `rule.prefer.wet-over-dry` grades a blocker.
 *
 * .note = what IS genuinely shared is already shared — `asMeterCountDisplay` single-sources the
 *         `∞` substitution both tails need, extracted at its own third usage.
 */
const asMeterSpendLine = (input: { meter: BudgetGrantMeter }): string => {
  const budget = asMeterCountDisplay(input.meter.budget);
  const left = input.meter.budget - input.meter.rounds;

  // 🔴 the tail is built by EARLY RETURNS, never a chained ternary. the two questions are
  //    unrelated — *is the budget finite* and *are rounds left* — so a chain reads as one decision
  //    and is two (`rule.forbid.else-branches` names the chained form as the hazard; the peer
  //    operation `asConcessionReasonDisplay` states the same standard).
  //
  // .note = the unlimited branch leads because it answers on its own — a budget with no bound has
  //         no `left` to report, so the second question never arises.
  const asTail = (): string => {
    if (!Number.isFinite(input.meter.budget))
      return `${input.meter.rounds} rounds spent, budget unlimited`;
    if (left > 0)
      return `${input.meter.rounds}/${budget} rounds spent — ${left} left`;
    return `${input.meter.rounds}/${budget} rounds spent`;
  };

  return `${input.meter.slug} = ${asTail()}`;
};

/**
 * .what = the reviewer a remedy command names
 * .why = a remedy a driver cannot copy is a remedy it must translate, and a translation at the
 *        moment of a refusal is where a driver reaches for the wrong lever. so the command names
 *        a real slug wherever one is UNAMBIGUOUS, and the `<reviewer>` placeholder otherwise.
 *
 * 🔴 .the placeholder and its selection rule are the EXTANT convention, not a coinage.
 *    `formatBlockRemedyGroups.ts:156` builds the same `--as absorbed --that <slug>` remedy and
 *    reads `exhaustedSlugs.length === 1 ? exhaustedSlugs[0]! : '<reviewer>'` — it declines to
 *    guess where several reviewers qualify. this matches that rule rather than restate it loosely.
 *
 * ⚠️ .an earlier form read `input.meters[0]?.slug` and took the FIRST, which is a defect the
 *    extant site had already avoided: a bare `--add N` scopes to the latest level, which may hold
 *    several dry reviewers, so "the first" names an arbitrary one and hands the driver a command
 *    that addresses the wrong reviewer. a placeholder a driver must fill beats a slug it must
 *    check.
 *
 * .note = the two are NOT extracted to one operation. their inputs differ (a slug array there, a
 *         meter array here) so a shared form would reshape at both call sites, and two usages sit
 *         under the rule of three (`rule.prefer.wet-over-dry`). what is shared is the RULE, and
 *         it is cited above so the next author finds it rather than re-derives it.
 */
const asNamedReviewer = (input: {
  peer: string | null;
  meters: BudgetGrantMeter[];
}): string => {
  // 🔴 the fallback is a GUARD CLAUSE, never a conditional nested inside a `??`. the nested form
  //    costs a reader two operators and a non-null assertion before the rule reads as
  //    *one meter → its slug, else the placeholder* (`rule.forbid.else-branches`).
  if (input.peer) return input.peer;
  return input.meters.length === 1 ? input.meters[0]!.slug : '<reviewer>';
};

/**
 * .what = the refusal a driver reads instead of a grant, as tree rows
 * .why = req 5 — the refusal NAMES the sanctioned move. a bare `error:` line satisfies what and
 *        why and cannot hold an ordered remedy whose order is itself part of the answer, so this
 *        follows the drive halts' precedent (`formatRouteDriveHalts`) rather than this command's
 *        other error paths: a `🗿` tree with a nested remedy block
 *        (`rule.require.errors-name-the-fix`).
 *
 * 🔴 .the header IS `routeGuardBudget`'s success skeleton — `route =`, `add =`, `peer =`, `level =` —
 *    so a driver reads ONE shape whether the grant lands or not. what swaps is the tail.
 *    `asGuardBudgetHeadLines` builds it for both paths, so the agreement is a property of the code
 *    rather than a note a future author must honour.
 *
 * 🔴 .the tips are tree ROWS, never warn lines suspended beneath the command.
 *    a tip that dangles off a command reads as a different kind of claim and costs a re-parse;
 *    a tip that is a branch is part of the answer (`rule.require.treestruct-output`). and they
 *    carry no `⚠️`: the refusal IS the warn, so a glyph stacked on it adds no signal and dilutes
 *    the one glyph that does (`rule.prefer.chill-nature-emojis` — important callouts only).
 *
 * 🔴 .the human path is deliberately ABSENT.
 *    `rule.always.spend-own-levers-before-escalation` measures the cost of the adjacency it
 *    would create: *"two remedies rendered side by side with no owner column read as two human
 *    remedies."* the driver's own lever at this cell is convergence, so the block is headed
 *    `yours to run` and carries only levers the driver owns. a driver that genuinely cannot
 *    converge reaches a human by `--as blocked`, which is the sanctioned escalation.
 */
export const formatBudgetGrantRefusalLines = (input: {
  refusal: BudgetGrantRefusal;
  route: string;
  stone: string;
  add: number;
  peer: string | null;
  level: number | null;
  /** the meters this write would have touched, for the remedy commands to name */
  meters: BudgetGrantMeter[];
}): string[] => {
  // 🔴 the head comes from `asGuardBudgetHeadLines`, which the SUCCESS emit also calls.
  //    two inline builders would have to agree by author discipline, which is the drift hazard
  //    `rule.require.single-source-of-truth-for-render` exists to close.
  const head = asGuardBudgetHeadLines({
    status: 'refused',
    route: input.route,
    add: input.add,
    peer: input.peer,
    level: input.level,
  });

  // the SCOPE refusal — one invocation named several stones, so the warrant of one would buy
  // rounds on all. it names what it matched, so the driver re-runs with the one it meant.
  //
  // 🔴 the stone names come from `getGuardStoneNames`, never from an inline basename+replace.
  //    that operation exists for THIS hint — its own `.why` says the no-match error lists the
  //    available stones so a driver can correct a mistyped `--stone`, and that "a named producer
  //    keeps that hint honest (not an ad-hoc inline)". one command over, same hint, same reason.
  if (input.refusal.kind === 'stone-matched-many') {
    const names = getGuardStoneNames({ guardPaths: input.refusal.guards });
    return [
      ...head,
      `   ├─ refused — --stone matched ${names.length} stones, and a warrant covers one`,
      ...names.map((name) => `   │  ├─ ${name}`),
      `   │  └─ --stone matches a stone and every stone beneath it, so a short name reaches many`,
      `   │`,
      `   └─ what to do — yours to run, no human needed`,
      `      └─ name the one stone you meant, in full`,
      // 🔴 the command comes from the CANONICAL builder, never an inline re-spell.
      //    `formatReviewBudgetTopupCommand` is the one renderer of this string, and it already
      //    served three callers — an inline fourth is a second source of truth for one fact, so
      //    the day the builder gains a flag this remedy would hand over a command the command
      //    itself refuses (`rule.require.single-source-of-truth-for-render`).
      //
      // 🔴 .and the command it hands over LANDS.
      //    `isStoneMatchedByName` resolves a full stone name to exactly one stone, so a name that
      //    opens another's — `1.execute` against `1.execute-b` — does not re-match both and
      //    re-refuse. without it this remedy is a dead loop.
      // 🔴 each command is a tree ROW, never a bare line suspended under the label.
      //    the precedent this file follows renders 23 of 23 remedy commands as `└─` rows
      //    (`formatRouteDriveHalts.test.ts.snap`), and the warrant branch below already does.
      //    a command that hangs beside one that branches reads as a different kind of claim and
      //    costs a re-parse — the cost `rule.require.treestruct-output` names.
      ...names.map(
        (name, index) =>
          `         ${index === names.length - 1 ? '└─' : '├─'} ${formatReviewBudgetTopupCommand(
            {
              add: input.add,
              peer: input.peer,
              stone: name,
            },
          )}`,
      ),
      ``,
    ];
  }

  // the MOMENT refusal — the reviewer can still run, so a grant buys it naught. the driver
  // spends the rounds it holds, and the bound bites where the route author set it to.
  //
  // 🔴 the copy says `reviewer`, and it is the RULED design's own word — *"∧ the target reviewer
  //    has run dry ← the moment"*. this is published cli, so it is contract-tier, and `lane` is a
  //    declared forbidden synonym there (`rule.forbid.domain-term-synonyms` binds contracts, and
  //    permits the synonym only in a comment).
  if (input.refusal.kind === 'rounds-remain')
    return [
      ...head,
      `   ├─ refused — rounds remain, and a grant needs a reviewer that has run dry`,
      ...input.refusal.meters.map(
        (meter) => `   │  ├─ ${asMeterSpendLine({ meter })}`,
      ),
      `   │  └─ a pad before the bound bites is the bound removed in advance`,
      `   │`,
      `   └─ what to do — yours to run, no human needed`,
      `      └─ spend the rounds in hand — re-arrive, and ask again once it has run dry`,
      // 🔴 a tree ROW, for the reason the scope branch above states in full.
      `         └─ rhx route.stone.set --stone ${input.stone} --as passed`,
      ``,
    ];

  // the WARRANT refusal — the round was not earned. the two remedies are the driver's own, and
  // the second is bounded by the harm set so a driver learns how to grade where it matters.
  //
  // 🔴 .the meter rows lead the diagnosis, exactly as the ruled render shows them.
  //    the gate's order is scope → warrant → moment, so a WARRANT refusal never evaluated the
  //    moment — the driver is told the round was not earned and cannot tell, from this render
  //    alone, whether the reviewer is even dry. ⇒ the meter says so, and the branch condition
  //    stays checkable rather than trusted (the same argument `asMeterSpendLine` carries above).
  const named = asNamedReviewer({ peer: input.peer, meters: input.meters });

  // 🔴 does the urgent-grade remedy actually UNBLOCK from here? only where the moment conjunct
  //    would also pass. the gate's order is scope → warrant → moment, so a warrant refusal never
  //    evaluated the moment — and a driver that follows this remedy at a live meter mints a harm
  //    claim with its own name on it and meets a SECOND, different refusal (`rounds-remain`).
  //
  //    ⚠️ measured on this repo's own route, `5.3.verification`, every reviewer at `0/3 — 3 left`:
  //       the warrant refusal rendered and its second remedy was the one that does not land.
  //       `rule.require.errors-name-the-fix` — *"an error that only reports failure has done half
  //       its job"* — so a named fix that does not fix is the same defect one step out.
  //
  // 🟡 the DIAGNOSIS stays unchanged: the head still says the round was not earned, because that
  //    is the conjunct the gate actually refused on. what this adds is one row under the remedy
  //    that would mislead, so the driver learns the second condition before it spends a grade
  //    rather than after.
  const anyDry = input.meters.some((meter) => hasReviewerRunDry({ meter }));

  // 🟡 the budget is named as a NUMBER only where ONE meter is in scope, so one number is
  //    unambiguous. a level scope holds several meters and therefore several budgets, and an
  //    unlimited budget has no number at all — both generalize rather than pick one.
  const authored =
    input.meters.length === 1 && Number.isFinite(input.meters[0]!.budget)
      ? {
          set: `${input.meters[0]!.budget}`,
          those: `those ${input.meters[0]!.budget}`,
        }
      : { set: 'the budget', those: 'those rounds' };

  return [
    ...head,
    `   ├─ refused — a grant needs a live urgent concession on the last round`,
    ...input.meters.map((meter) => `   │  ├─ ${asMeterSpendLine({ meter })}`),
    `   │  ├─ no live urgent concession stands on ${input.stone}`,
    `   │  └─ the route author set ${authored.set}, with the whole rubric in view`,
    `   │     ${authored.those} were the allowance for taste. past them, only harm buys a round`,
    `   │`,
    `   └─ what to do — yours to run, no human needed`,
    `      ├─ converge — a .taken per open .given, then re-arrive`,
    `      │  └─ rhx route.stone.set --stone ${input.stone} --as absorbed --that ${named}`,
    `      └─ or grade a concern urgent, where one ships nameable harm`,
    `         ├─ urgent = ${asUrgentHarmSet({ separator: ' · ' })}`,
    `         ├─ better = every other concern, and it earns no round`,
    ...(anyDry
      ? []
      : [
          `         ├─ and spend the rounds in hand first — a grant needs a reviewer that has run dry`,
        ]),
    `         └─ rhx route.stone.set --stone ${input.stone} --as conceded \\`,
    `              --with ${named} --about <concern> --severity urgent`,
    ``,
  ];
};
