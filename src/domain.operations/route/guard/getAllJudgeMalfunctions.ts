/**
 * .what = the judges that malfunctioned and are not forgiven
 * .why = names the malfunction gate's judge set, so the passage orchestrator reads it as one
 *        call rather than a compound predicate to simulate
 *        (rule.forbid.decode-friction-in-orchestrators). the forgiveness rule is the
 *        caller's single per-judge rule, passed in, so every consumer reads the same one
 */
export const getAllJudgeMalfunctions = <
  TJudge extends { exitClass: string },
>(input: {
  judges: TJudge[];
  isForgiven: (judge: TJudge) => boolean;
}): TJudge[] =>
  input.judges.filter(
    (judge) => judge.exitClass === 'malfunction' && !input.isForgiven(judge),
  );
