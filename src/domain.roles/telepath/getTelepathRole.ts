import { Role } from 'rhachet';

/**
 * .what = telepath role definition
 * .why = enables max signal, min noise transfer between actors, in both directions
 */
export const ROLE_TELEPATH: Role = Role.build({
  slug: 'telepath',
  name: 'Telepath',
  purpose: 'transfer concepts whole, at the fewest words',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role telepath',
          timeout: 'PT30S',
        },
      ],
      // onStop: remind the brain to elucidate + condense its summary.
      //
      // a review rubric reads FILES, so it cannot reach a live message; a booted
      // brief was measured insufficient (asks with headers, all missed). Stop is
      // the last moment before rest, and the reflexive pass is exactly the pass a
      // brain skips there (rule.require.reflexive-condensation).
      //
      // it holds the *stop* open (exit 2), never a *write* — the same mechanism
      // as the driver's route.drive and the learner's learn.domain.terms. it
      // grades naught: the judgment "did the concept transfer?" belongs to the
      // brain that holds the context, in the turn the reminder holds open
      // (rule.always.entool-the-skills-you-touch).
      onStop: [
        {
          command:
            './node_modules/.bin/rhx elucidate.summary --when hook.onStop',
          timeout: 'PT5S',
        },
      ],
    },
  },
});
