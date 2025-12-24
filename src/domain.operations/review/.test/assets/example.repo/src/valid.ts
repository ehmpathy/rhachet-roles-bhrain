/**
 * .what = example valid file with no violations
 * .why = used as clean target for review tests
 */
export const validFunction = (input: { value: string }): string => {
  return input.value.toUpperCase();
};

export const anotherValidFunction = (input: { count: number }): number => {
  return input.count * 2;
};
