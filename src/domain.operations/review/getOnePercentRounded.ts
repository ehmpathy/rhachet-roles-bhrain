/**
 * .what = rounds a percent to one decimal place
 * .why = the render shows `55.7%`, never `55.73412%`; the gates keep the exact figure
 */
export const getOnePercentRounded = (input: { percent: number }): number =>
  Math.round(input.percent * 10) / 10;
