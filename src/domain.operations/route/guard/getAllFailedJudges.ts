/**
 * .what = the judges that did not pass and are not forgiven
 * .why = names the rejection gate's judge set, so the passage orchestrator reads it as one
 *        call rather than a compound predicate to simulate
 *        (rule.forbid.decode-friction-in-orchestrators). the forgiveness rule is the
 *        caller's single per-judge rule, passed in, as `getAllJudgeMalfunctions` takes it
 */
export const getAllFailedJudges = <TJudge extends { passed: boolean }>(input: {
  judges: TJudge[];
  isForgiven: (judge: TJudge) => boolean;
}): TJudge[] =>
  input.judges.filter((judge) => !judge.passed && !input.isForgiven(judge));
