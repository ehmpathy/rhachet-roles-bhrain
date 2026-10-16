/**
 * .what = context type that carries the guard round a write belongs to
 * .why = every write a guard round makes — a given, a meter, a latch, a verdict — checks
 *        the stone's rewind generation against the one the round began at, so a round a
 *        rewind superseded writes naught (setStoneGuardRoundOutput). the round's start
 *        generation rides the (input, context) chain from `setStoneAsPassed`, the one
 *        place a round begins, to each writer below it
 *
 * .note = tests that run a review or judge pass on a fresh route pass
 *         { guardRound: { generation: 0 } } — a route never rewound is at generation 0
 */
export interface ContextStoneGuardRound {
  guardRound: {
    /**
     * the stone's rewind generation at the moment the round began
     */
    generation: number;
  };
}
