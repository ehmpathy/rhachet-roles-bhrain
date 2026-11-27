import { Role } from 'rhachet';

/**
 * .what = skeptic role definition
 * .why = trust no one, especially not yourself: a peer is never the first skeptic of your claim
 * .note = no hooks. each hook this role once held graded a reply's words, and flagged honest replies as often as stale
 *         ones, so a reader learned to skip it. the doubt lives in the briefs, and in acts that test a belief against the
 *         world (predict before you look; send no claim before its read)
 */
export const ROLE_SKEPTIC: Role = Role.build({
  slug: 'skeptic',
  name: 'Skeptic',
  purpose:
    'trust no one, especially not yourself; doubt each claim of yours before it reaches a peer',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  skills: {
    dirs: [],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
