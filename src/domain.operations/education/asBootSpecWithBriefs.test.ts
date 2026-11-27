import { ConstraintError } from 'helpful-errors';
import { getError } from 'test-fns';

import { asBootClaim } from './asBootClaim';
import { asBootSpecNames, type BootSpecMode } from './asBootSpecNames';
import { asBootSpecWithBriefs } from './asBootSpecWithBriefs';

const AT = 'src/domain.roles/x/boot.yml';

const SPEC_FULL = [
  'budget:',
  '  tokens: 10_000',
  'always:',
  '  briefs:',
  '    say:',
  '      # identity',
  '      - briefs/im_a.role.md',
  '    ref:',
  '      # depth',
  '      - briefs/howto.x.md',
  '',
].join('\n');

const TEST_CASES: Array<{
  description: string;
  given: {
    spec: string;
    say: string[];
    ref: string[];
    isRoleSpec: boolean;
    modeOfRole: BootSpecMode | null;
  };
  expect: string;
}> = [
  {
    description:
      'subject: appends under each key, after the role own lead briefs, comments kept',
    given: {
      spec: SPEC_FULL,
      say: ['briefs/education/pedigree._.md'],
      ref: ['briefs/education/pedigree.pursuit=v2026_11_23.x.md'],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect: [
      'budget:',
      '  tokens: 10_000',
      'always:',
      '  briefs:',
      '    say:',
      '      # identity',
      '      - briefs/im_a.role.md',
      '      - briefs/education/pedigree._.md',
      '    ref:',
      '      # depth',
      '      - briefs/howto.x.md',
      '      - briefs/education/pedigree.pursuit=v2026_11_23.x.md',
      '',
    ].join('\n'),
  },
  {
    description:
      'subject: leaves the spec byte-equal when each path is already named',
    given: {
      spec: SPEC_FULL,
      say: ['briefs/im_a.role.md'],
      ref: ['briefs/howto.x.md'],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect: SPEC_FULL,
  },
  {
    description: 'subject: adds the ref key when the spec holds only say',
    given: {
      spec: 'always:\n  briefs:\n    say:\n      - briefs/a.md\n',
      say: [],
      ref: ['briefs/b.md'],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect:
      'always:\n  briefs:\n    ref:\n      - briefs/b.md\n    say:\n      - briefs/a.md\n',
  },
  {
    description:
      'subject: opens an empty flow list (`say: []`) rather than add a twin key',
    given: {
      spec: 'always:\n  briefs:\n    say: []\n',
      say: ['briefs/a.md'],
      ref: [],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect: 'always:\n  briefs:\n    say:\n      - briefs/a.md\n',
  },
  {
    description:
      'simple: opens an empty flow map (`briefs: {}`) rather than add a twin key',
    given: {
      spec: 'briefs: {}\nskills: {}\n',
      say: ['briefs/a.md'],
      ref: ['briefs/b.md'],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect: 'briefs:\n  ref:\n    - briefs/b.md\nskills: {}\n',
  },
  {
    description:
      'subject: opens an empty flow map (`always: {}`) rather than add a twin key',
    given: {
      spec: 'always: {}\n',
      say: ['briefs/a.md'],
      ref: [],
      isRoleSpec: false,
      modeOfRole: 'subject',
    },
    expect: 'always:\n  briefs:\n    say:\n      - briefs/a.md\n',
  },
  {
    description: 'subject: matches a list that sits at its key indent',
    given: {
      spec: 'always:\n  briefs:\n    say:\n    - briefs/a.md\n',
      say: ['briefs/b.md'],
      ref: [],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect:
      'always:\n  briefs:\n    say:\n    - briefs/a.md\n    - briefs/b.md\n',
  },
  {
    description: 'subject: names a path that appears only under another key',
    given: {
      spec: 'never:\n  - briefs/a.md\nalways:\n  briefs:\n    say:\n      - briefs/z.md\n',
      say: ['briefs/a.md'],
      ref: [],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect:
      'never:\n  - briefs/a.md\nalways:\n  briefs:\n    say:\n      - briefs/z.md\n      - briefs/a.md\n',
  },
  {
    description:
      'simple role with no say: says all already, so only the entry gains a ref; no say key narrows it',
    given: {
      spec: 'budget:\n  tokens: 1000\n',
      say: ['briefs/a.md'],
      ref: ['briefs/b.md'],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect: 'budget:\n  tokens: 1000\nbriefs:\n  ref:\n    - briefs/b.md\n',
  },
  {
    description:
      'simple role with a say list: the index joins the list; the entry is ref by omission',
    given: {
      spec: 'briefs:\n  say:\n    - briefs/im_a.role.md\n',
      say: ['briefs/a.md'],
      ref: ['briefs/b.md'],
      isRoleSpec: true,
      modeOfRole: null,
    },
    expect: 'briefs:\n  say:\n    - briefs/im_a.role.md\n    - briefs/a.md\n',
  },
  {
    description:
      'linked mod of a subject role: the `of:` seed gains `always.briefs`',
    given: {
      spec: 'of: bhuild/architect\n',
      say: ['briefs/a.md'],
      ref: ['briefs/b.md'],
      isRoleSpec: false,
      modeOfRole: 'subject',
    },
    expect:
      'of: bhuild/architect\nalways:\n  briefs:\n    say:\n      - briefs/a.md\n    ref:\n      - briefs/b.md\n',
  },
  {
    description:
      'linked mod of a simple role: the `of:` seed gains top-level `briefs`, both named (a mod claims only what it names)',
    given: {
      spec: 'of: bhuild/architect\n',
      say: ['briefs/a.md'],
      ref: ['briefs/b.md'],
      isRoleSpec: false,
      modeOfRole: 'simple',
    },
    expect:
      'of: bhuild/architect\nbriefs:\n  say:\n    - briefs/a.md\n  ref:\n    - briefs/b.md\n',
  },
];

describe('asBootSpecWithBriefs', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const spec = asBootSpecWithBriefs({ ...thisCase.given, at: AT });
      expect(spec).toEqual(thisCase.expect);

      // each result parses, and boots each path where it was asked, by rhachet's mode rules
      const names = asBootSpecNames({ spec, at: AT });
      const claimOf = (p: string) =>
        asBootClaim({
          curation: names.briefs,
          mode: names.mode,
          isRoleSpec: thisCase.given.isRoleSpec,
          path: p,
        });
      thisCase.given.say.map((p) => expect(claimOf(p)).toEqual('say'));
      thisCase.given.ref.map((p) => expect(claimOf(p)).toEqual('ref'));
    }),
  );

  test('refuses a spec that does not parse, a twin key included', async () => {
    const error = await getError(async () =>
      asBootSpecWithBriefs({
        spec: 'always:\n  briefs:\n    say:\n      - a.md\n    say:\n      - b.md\n',
        say: ['briefs/c.md'],
        ref: [],
        at: AT,
        isRoleSpec: true,
        modeOfRole: null,
      }),
    );
    expect(error).toBeInstanceOf(ConstraintError);
    expect(error.message).toContain('a boot spec does not parse as yaml');
  });

  test('refuses a splice that cannot name the path where asked', async () => {
    const error = await getError(async () =>
      asBootSpecWithBriefs({
        spec: 'always:\n  briefs: { say: [briefs/z.md] }\n',
        say: ['briefs/a.md'],
        ref: [],
        at: AT,
        isRoleSpec: true,
        modeOfRole: null,
      }),
    );
    expect(error).toBeInstanceOf(ConstraintError);
  });

  test('refuses a mod in a mode its role does not use', async () => {
    const error = await getError(async () =>
      asBootSpecWithBriefs({
        spec: 'of: bhuild/architect\nalways:\n  briefs:\n    say:\n      - briefs/z.md\n',
        say: ['briefs/a.md'],
        ref: [],
        at: AT,
        isRoleSpec: false,
        modeOfRole: 'simple',
      }),
    );
    expect(error).toBeInstanceOf(ConstraintError);
    expect(error.message).toContain(
      "the boot spec is in subject mode, but its role's is in simple mode",
    );
  });
});
