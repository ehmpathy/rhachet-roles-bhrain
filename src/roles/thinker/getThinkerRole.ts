import { Role, RoleTrait } from 'rhachet';

import { getThinkerBrief } from '@src/roles/thinker/getThinkerBrief';
import { SKILL_ARTICULATE } from '@src/roles/thinker/skills/brief.articulate/stepArticulate.skill';
import { SKILL_CATALOGIZE } from '@src/roles/thinker/skills/brief.catalogize/stepCatalogize.skill';
import { SKILL_DEMONSTRATE } from '@src/roles/thinker/skills/brief.demonstrate/stepDemonstrate.skill';
import { SKILL_CLUSTER } from '@src/roles/thinker/skills/khue.cluster/stepCluster.skill';
import { SKILL_DIVERGE } from '@src/roles/thinker/skills/khue.diverge/stepDiverge.skill';
import { SKILL_INSTANTIATE } from '@src/roles/thinker/skills/khue.instantiate/stepInstantiate.skill';
import { SKILL_TRIAGE } from '@src/roles/thinker/skills/khue.triage/stepTriage.skill';

export const ROLE_THINKER: Role = Role.build({
  slug: 'thinker',
  name: 'Thinker',
  purpose: 'think',
  readme: `
## 🧠 Thinker

thought tactics; intent = be composed into other roles
  `.trim(),
  traits: [
    RoleTrait.build({
      slug: 'ocd',
      readme: 'obsesses over structure, precision, and clarity',
      brief: getThinkerBrief('trait.ocd.md'),
    }),
    RoleTrait.build({
      slug: 'vibes',
      readme: 'careful about the aesthetics of their output',
      brief: getThinkerBrief('style.words.lowercase.md'),
    }),
  ],
  skills: {
    dirs: [],
    refs: [
      // khue primitives
      SKILL_DIVERGE,
      SKILL_CLUSTER,
      SKILL_TRIAGE,
      SKILL_INSTANTIATE,

      // know primitives
      SKILL_ARTICULATE,
      SKILL_DEMONSTRATE,
      SKILL_CATALOGIZE,

      // goal primitives
      // SKILL_INTERPRET; ask -> Focus[Goal]
    ],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
