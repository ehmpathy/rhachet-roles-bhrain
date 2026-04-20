import * as fs from 'fs/promises';
import * as path from 'path';

import { Ask } from '@src/domain.objects/Achiever/Ask';

/**
 * .what = expands abbreviated hashes to full SHA256 hashes
 * .why = CLI displays 7-char abbreviated hashes, but coverage needs full 64-char hashes
 * .note = throws if an abbreviated hash matches multiple asks (ambiguous) or none (not found)
 */
export const expandAbbreviatedHashes = async (input: {
  abbreviatedHashes: string[];
  scopeDir: string;
}): Promise<{ fullHashes: string[] }> => {
  // read asks inventory
  const asks: Ask[] = [];
  const inventoryPath = path.join(input.scopeDir, 'asks.inventory.jsonl');
  try {
    const inventoryContent = await fs.readFile(inventoryPath, 'utf-8');
    const lines = inventoryContent.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line);
      asks.push(new Ask(parsed));
    }
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code !== 'ENOENT') throw error;
    // no inventory = no asks to match
  }

  // expand each abbreviated hash
  const fullHashes: string[] = [];
  for (const abbrev of input.abbreviatedHashes) {
    // if already 64 chars, it's a full hash
    if (abbrev.length === 64) {
      fullHashes.push(abbrev);
      continue;
    }

    // find asks that start with this abbreviation
    const matches = asks.filter((a) => a.hash.startsWith(abbrev));

    if (matches.length === 0) {
      throw new Error(`ask hash not found: ${abbrev}`);
    }

    // dedupe by full hash — duplicate asks with identical content have the same hash
    const uniqueHashes = [...new Set(matches.map((m) => m.hash))];

    if (uniqueHashes.length > 1) {
      throw new Error(
        `ask hash ambiguous: ${abbrev} matches ${uniqueHashes.length} distinct hashes`,
      );
    }

    fullHashes.push(uniqueHashes[0]!);
  }

  return { fullHashes };
};
