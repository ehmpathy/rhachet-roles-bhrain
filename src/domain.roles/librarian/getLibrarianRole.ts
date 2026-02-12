import { Role } from 'rhachet';

/**
 * .what = librarian role definition
 * .why = enables curation of knowledge into structured briefs via brain invocation
 */
export const ROLE_LIBRARIAN: Role = Role.build({
  slug: 'librarian',
  name: 'Librarian',
  purpose: 'curate knowledge into structured briefs',
  readme: { uri: __dirname + '/.readme.[seed].md' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
