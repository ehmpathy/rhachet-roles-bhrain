import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';

/**
 * .what = summary of all annotations for a scope
 * .why = enables enumeration of timeline labels
 */
export interface AnnotationSummary {
  count: number;
  annotations: Array<{
    timestamp: string;
    text: string;
    path: string;
  }>;
}

/**
 * .what = parses annotation file to extract text
 * .why = annotations stored as markdown with frontmatter
 */
const parseAnnotationFile = (
  filePath: string,
): { timestamp: string; text: string } | null => {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');

  // extract timestamp from frontmatter
  const timestampMatch = content.match(/^---\ntimestamp:\s*(.+)\n/m);
  const timestamp = timestampMatch?.[1] ?? '';

  // extract text after frontmatter
  const parts = content.split('---\n');
  const text = parts.length >= 3 ? parts.slice(2).join('---\n').trim() : '';

  return { timestamp, text };
};

/**
 * .what = enumerates all annotations for a scope
 * .why = enables timeline review of labeled moments
 */
export const getAllAnnotations = (input: {
  scope: ReflectScope;
}): AnnotationSummary => {
  // construct annotations directory path
  const annotationsDir = path.join(input.scope.storagePath, 'annotations');

  // return empty if directory absent
  if (!fs.existsSync(annotationsDir)) {
    return { count: 0, annotations: [] };
  }

  // enumerate annotation files
  const files = fs.readdirSync(annotationsDir);
  const annotationFiles = files.filter((f) => f.endsWith('.annotation.md'));

  // parse each annotation
  const annotations = annotationFiles
    .map((file) => {
      const filePath = path.join(annotationsDir, file);
      const parsed = parseAnnotationFile(filePath);
      if (!parsed) return null;
      return {
        timestamp: parsed.timestamp,
        text: parsed.text,
        path: filePath,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // sort by timestamp (oldest first)
  annotations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    count: annotations.length,
    annotations,
  };
};
