import { Role } from 'rhachet';

import { SKILL_ACT } from '@src/domain.roles/brain/skills/act/skillAct';

/**
 * .what = role definition for the brain
 * .why = exposes agentic capabilities as rhachet skills for tool-using llm workflows
 */
export const ROLE_BRAIN: Role = Role.build({
  slug: 'brain',
  name: 'Brain',
  purpose: 'agentic entooled brain',
  readme: { uri: __dirname + '/readme.md' },
  traits: [],
  skills: {
    dirs: [],
    refs: [SKILL_ACT],
  },
  briefs: {
    dirs: [],
  },
});
