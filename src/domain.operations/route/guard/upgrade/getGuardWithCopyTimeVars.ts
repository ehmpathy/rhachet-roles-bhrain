/**
 * .what = replays the sole COPY-TIME guard var — `$BEHAVIOR_DIR_REL` → route rel dir
 * .why = bhuild's init substitutes exactly one variable at copy time
 *   (`$BEHAVIOR_DIR_REL`); an upgrade must replay it so the re-copied guard points at
 *   THIS route's own dir, not the template's. every OTHER `$VAR` is a runtime var and
 *   is left literal (substituted at judge-run time, not here).
 */
export const getGuardWithCopyTimeVars = (input: {
  content: string;
  routeRelDir: string;
}): string => input.content.replace(/\$BEHAVIOR_DIR_REL/g, input.routeRelDir);
