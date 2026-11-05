import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import { StringDecoder } from 'string_decoder';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import {
  MARKER_OF_OUTPUT_FORMAT,
  MARKER_OF_TARGET,
} from '@src/domain.operations/review/getOneHeadMarkerOffsets';
import { getOneOffsetOfFirstBlockMarker } from '@src/domain.operations/review/getOneOffsetOfFirstBlockMarker';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the bytes the head read pulls per step
 * .why = a corpus-first head carries every target body and runs to a megabyte, while the
 *        span a lane keys on ends at the target block — kilobytes in. the read stops there
 */
const BYTES_OF_CHUNK = 64 * 1024;

/**
 * .what = the offset where a head's lane span ends — its target block — or -1 where the
 *         text so far holds none
 * .why = 🔴 a corpus-first head carries every target body, so a whole-head digest moves on
 *        every repaired file, and each repair round would read as a new lane graded
 *        "cold: first round". a lane is what a cache is shared OVER, and the corpus is
 *        what the cache keeps across a repair — so the key is the span ahead of it: the
 *        instructions and the output contract. a rubric-first head on disk holds no
 *        target block, so its whole text is the span, and its digest is unchanged
 *
 * .note = sought from the output contract, never from the head's start, so a goal that
 *         quotes `## target` cannot capture the cut
 */
const asHeadSpanEnd = (input: { head: string }): number => {
  const atOutputFormat = input.head.indexOf(MARKER_OF_OUTPUT_FORMAT);
  if (atOutputFormat < 0) return -1;
  return getOneOffsetOfFirstBlockMarker({
    text: input.head,
    from: atOutputFormat,
    markers: [MARKER_OF_TARGET],
  });
};

/**
 * .what = the content digest of a run's prompt head, ahead of its target block, or null
 *         where the run wrote none
 * .why = the head is the system message, so two runs of one slug share a prefix only
 *        where it is byte-identical up to the corpus — new instructions, a new goal, or a
 *        new output contract is a new prefix, and the digest is what names it. the corpus
 *        is keyed out (`asHeadSpanEnd`): a repaired file parts the prefix, never the
 *        lane. pinned by `getOneReviewRunHead.integration.test.ts` [case4] and [case5]
 *
 * .note = keyed by CONTENT, never by path: every run writes its head into its own log dir
 *
 * 🟡 .note = it digests LESS than the whole head block: the instructions and the output
 *         contract alone, never the corpus behind them. `ReviewRunMeter.head` and
 *         `lane.head` carry this digest under the name `head`, which the `--json` of
 *         `review._.cost` publishes, so the name stands and this note states its sense
 *
 * .note = null is "no head on record" — a refusal, or a run older than the artifact.
 *         it is never a guess at the head, so two such runs pair only with each other
 *
 * .note = read a chunk at a time, and only to the target block: every lane fold reads
 *         this per run, and a grove holds hundreds. the text read so far answers the cut
 *         exactly as the whole file would, since the span ends where the marker begins
 */
export const getOneReviewRunHead = async (input: {
  dir: string;
}): Promise<string | null> => {
  const span = await getOneHeadSpanOfFile({
    at: asRunArtifactPath({ dir: input.dir, artifact: 'head' }),
  });
  if (span === null) return null;
  return createHash('sha256').update(span).digest('hex').slice(0, 16);
};

/**
 * .what = the lane span of a head file on disk, read only as far as its cut — or null
 *         where the file is not there
 * .why = absence is a fact (no head on record); a read fault of a file that IS there is a
 *        defect, and surfaces with its path (rule.forbid.failhide)
 */
const getOneHeadSpanOfFile = async (input: {
  at: string;
}): Promise<string | null> => {
  const handle = await fs.open(input.at, 'r').catch((error: unknown) => {
    // an absent head is a fact, never a fault
    if (isErrorOfAbsence({ error })) return null;
    throw new ReviewRunArtifactError('could not read a file', {
      at: input.at,
      error: String(error),
    });
  });
  if (handle === null) return null;

  try {
    // .note = deliberate mutation, a scoped zone — the decoder and the text are born here
    //         and returned whole; a chunk loop must carry its offset and text forward
    //         (rule.require.immutable-vars — annotated-mutation exception)
    const decoder = new StringDecoder('utf8');
    const read = { at: 0, text: '', isDone: false };
    while (!read.isDone) {
      const buffer = Buffer.alloc(BYTES_OF_CHUNK);
      const { bytesRead } = await handle.read(
        buffer,
        0,
        BYTES_OF_CHUNK,
        read.at,
      );
      read.at += bytesRead;
      read.text +=
        bytesRead === 0
          ? decoder.end()
          : decoder.write(buffer.subarray(0, bytesRead));
      const cut = asHeadSpanEnd({ head: read.text });
      if (cut >= 0) return read.text.slice(0, cut);
      read.isDone = bytesRead === 0;
    }
    return read.text;
  } finally {
    await handle.close();
  }
};
