import * as fs from 'fs/promises';

import { getOneCharCountOfUtf8Bytes } from '@src/domain.operations/review/meter/getOneCharCountOfUtf8Bytes';
import { getOneSharedPrefixByteCount } from '@src/domain.operations/review/meter/getOneSharedPrefixByteCount';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the bytes a chunk read pulls from each prompt per step
 * .why = a prompt runs to hundreds of kilobytes, and a corpus to hundreds of prompts.
 *        a chunk read stops at the first divergent chunk, so a pair whose prefix parts
 *        early costs one chunk per side rather than two whole prompts
 */
const BYTES_OF_CHUNK = 64 * 1024;

/**
 * .what = the longest common byte prefix of two prompt files on disk, in bytes and chars
 * .why = the most a prompt cache could have served the later prompt from the earlier
 *        one. a cache keys on the exact byte prefix from offset 0, so this is a byte
 *        compare, never a line diff — one changed byte mid-line ends the prefix, where
 *        a line diff would over-report by the rest of that line
 *
 * .note = null where either prompt is not on disk — a refusal compiled none, or a
 *         driver pruned it. an absent prompt measures naught, so it must never read
 *         as a shared prefix of zero, which would grade the pair `unshared`
 *         (rule.forbid.failhide)
 *
 * .note = every scan is `getOneSharedPrefixByteCount`, one chunk pair at a time — the
 *         same instrument the cache anatomy suite measures with
 */
export const getOneSharedPrefixOfPromptFiles = async (input: {
  earlier: string;
  later: string;
}): Promise<{ bytes: number; chars: number; laterBytes: number } | null> => {
  // open both, or answer null where either is absent
  const [earlier, later] = await Promise.all([
    getOneFileHandleOrNull({ at: input.earlier }),
    getOneFileHandleOrNull({ at: input.later }),
  ]);
  if (earlier === null || later === null) {
    await Promise.all([earlier?.close(), later?.close()]);
    return null;
  }

  try {
    const laterBytes = (await later.stat()).size;
    const shared = await getOneSharedPrefixOfHandles({ earlier, later });
    return { ...shared, laterBytes };
  } finally {
    await Promise.all([earlier.close(), later.close()]);
  }
};

/**
 * .what = the shared prefix of two open files, read one chunk pair at a time
 * .why = the scan the communicator above wraps, apart from its open and close
 */
const getOneSharedPrefixOfHandles = async (input: {
  earlier: fs.FileHandle;
  later: fs.FileHandle;
}): Promise<{ bytes: number; chars: number }> => {
  // .note = deliberate mutation, and a scoped zone — the offset and the char tally are
  //         born here and returned whole. a chunk loop must carry its offset forward,
  //         and a recursion over a megabyte prompt would deepen the stack per chunk
  //         (rule.require.immutable-vars — annotated-mutation exception)
  const tally = { bytes: 0, chars: 0, isChunkWhole: true };
  while (tally.isChunkWhole) {
    const [chunkEarlier, chunkLater] = await Promise.all([
      getOneChunkAt({ handle: input.earlier, at: tally.bytes }),
      getOneChunkAt({ handle: input.later, at: tally.bytes }),
    ]);
    const shared = getOneSharedPrefixByteCount({
      a: chunkEarlier,
      b: chunkLater,
    });
    tally.bytes += shared;
    tally.chars += getOneCharCountOfUtf8Bytes({
      bytes: chunkLater.subarray(0, shared),
    });

    // the scan reads on only where this whole chunk pair matched; else the prefix
    // ended inside it, or one file ran out
    tally.isChunkWhole =
      shared === BYTES_OF_CHUNK &&
      chunkEarlier.length === BYTES_OF_CHUNK &&
      chunkLater.length === BYTES_OF_CHUNK;
  }
  return { bytes: tally.bytes, chars: tally.chars };
};

/**
 * .what = the bytes of one chunk of a file, from an offset — fewer at the file's end
 * .why = one read shape for both sides of the scan
 */
const getOneChunkAt = async (input: {
  handle: fs.FileHandle;
  at: number;
}): Promise<Buffer> => {
  const buffer = Buffer.alloc(BYTES_OF_CHUNK);
  const { bytesRead } = await input.handle.read(
    buffer,
    0,
    BYTES_OF_CHUNK,
    input.at,
  );
  return buffer.subarray(0, bytesRead);
};

/**
 * .what = an open read handle on a file, or null where it is not there
 * .why = absence is a fact the pair reports; a read fault of a file that IS there is a
 *        defect, and surfaces with its path (rule.forbid.failhide)
 */
const getOneFileHandleOrNull = async (input: {
  at: string;
}): Promise<fs.FileHandle | null> => {
  try {
    return await fs.open(input.at, 'r');
  } catch (error) {
    // an absent prompt is a fact, never a fault
    if (isErrorOfAbsence({ error })) return null;
    throw new ReviewRunArtifactError('could not read a prompt', {
      at: input.at,
      error: String(error),
    });
  }
};
