import { Role } from 'rhachet';

/**
 * .what = role definition for the architect
 * .why = documents and compares architectures of replic brains (LLMs behind REPLs)
 */
export const ROLE_ARCHITECT: Role = Role.build({
  slug: 'architect',
  name: 'Architect',
  purpose: 'brain architecture patterns',
  readme: `
## 🏗️ Architect

- **scale**: conceptual, architectural
- **focus**: brain architecture patterns
- **maximizes**: understanding of how artificial brains are constructed

used to document and compare architectures of replic brains (LLMs behind REPLs).
  `.trim(),
  traits: [],
  skills: {
    dirs: [],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
