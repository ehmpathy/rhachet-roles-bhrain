/**
 * .what = example file with violations
 * .why = used as target with issues for review tests
 */

// violation: uses console.log
export const badFunction = (value: any): void => {
  console.log('this is bad:', value);
};

// violation: uses any type
export const anotherBadFunction = (input: any) => {
  return input.something;
};
