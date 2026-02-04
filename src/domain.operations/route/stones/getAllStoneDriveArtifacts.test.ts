import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getAllStoneDriveArtifacts } from './getAllStoneDriveArtifacts';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('getAllStoneDriveArtifacts', () => {
  given('[case1] route.simple fixture with no artifacts', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');

    when('[t0] artifacts are retrieved', () => {
      then('returns 3 artifact records', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        expect(artifacts).toHaveLength(3);
      });

      then('each artifact has empty outputs', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        for (const artifact of artifacts) {
          expect(artifact.outputs).toHaveLength(0);
        }
      });

      then('each artifact has null passage', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        for (const artifact of artifacts) {
          expect(artifact.passage).toBeNull();
        }
      });
    });
  });

  given('[case2] route.approved fixture with artifact and passage', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');

    when('[t0] artifacts are retrieved', () => {
      then('returns 1 artifact record', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        expect(artifacts).toHaveLength(1);
      });

      then('artifact has outputs populated', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        expect(artifacts[0]?.outputs.length).toBeGreaterThan(0);
        expect(artifacts[0]?.outputs[0]).toContain('1.vision');
      });

      then('artifact has passage populated', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        expect(artifacts[0]?.passage).not.toBeNull();
        expect(artifacts[0]?.passage).toContain('.passed');
      });
    });
  });

  given('[case3] route.parallel fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.parallel');

    when('[t0] artifacts are retrieved', () => {
      then('returns 5 artifact records', async () => {
        const artifacts = await getAllStoneDriveArtifacts({ route: routePath });
        expect(artifacts).toHaveLength(5);
      });
    });
  });
});
