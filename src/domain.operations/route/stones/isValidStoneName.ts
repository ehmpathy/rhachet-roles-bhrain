/**
 * .what = validates stone name format
 * .why = ensures consistent stone names across routes (numeric prefix + alpha segment)
 *
 * .note = valid: 3.1.6.research.custom, 5.2.evaluation, 1.vision
 *         invalid: research (no numeric), 3.1.6 (no alpha)
 */
export const isValidStoneName = (input: {
  name: string;
}): { valid: boolean; reason: string | null } => {
  // empty string is invalid
  if (!input.name || input.name.trim() === '') {
    return { valid: false, reason: 'stone name cannot be empty' };
  }

  // regex: starts with numeric segment(s), followed by at least one alpha segment
  // valid: 3.1.6.research.custom, 5.2.evaluation, 1.vision
  // invalid: research (no numeric prefix), 3.1.6 (no alpha segment)
  const pattern = /^[0-9]+(\.[0-9]+)*\.[a-zA-Z]/;
  if (!pattern.test(input.name)) {
    return {
      valid: false,
      reason:
        'stone name must have numeric prefix followed by at least one alpha segment (e.g., 3.1.6.research.custom)',
    };
  }

  return { valid: true, reason: null };
};
