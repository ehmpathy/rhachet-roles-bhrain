// deliberately term-clean under both learner rubrics:
// - application: one domain operation, each word in one sense, each concept named one way
// - aggregation: every constituent term of that operation — `get`, `lesson`, `price` — is
//   itemized in this repo's glossary at .agent/repo=.this/role=any/briefs/domain.terms/
// used by the learner acceptance cases that assert a clean review set approves.

export const getLessonPrice = (input: { lesson: { minutes: number } }): number => {
  return input.lesson.minutes * 2;
};
