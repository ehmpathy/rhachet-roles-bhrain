/**
 * .what = the most bytes one git read may return — 64 MiB — for the selection's reads
 *         (`getAllFileChangesFromRange`) and each patch read (`getAllFileDiffsOfChanges`)
 * .why = a patch is the review's SUBJECT, and its size is the overflow gate's to judge,
 *        never a pipe buffer's. node's default `maxBuffer` is 1 MiB, so a new file of
 *        1 MiB or more threw `spawnSync /bin/sh ENOBUFS` before the gate could weigh it —
 *        a crash where the review owed a refusal that names the lever.
 *
 *        one home for both reads, so a selection that fits can never feed a patch read
 *        held to a smaller bound
 */
export const MAX_BYTES_OF_ONE_GIT_READ = 64 * 1024 * 1024;
