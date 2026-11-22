# inventory.of=fulcrums — v2026_11_19.declapract.upgrade

| case | title | rework | status | confidence |
|---|---|---|---|---|
| F1-node16-or-commonjs | adopt the practice's node16 module resolution, or declare a repo override | dirty | ruled: conform. done, types pass | 90% |
| F2-build-into-dist-or-dist-next | let the build write straight into dist/, or keep the dist.next swap | clean | ruled: conform now; swap dropped, restore once upstream ships a staged build or override | 85% |
| F3-retired-cache-wrapper | migrate the one call site of the retired cache wrapper to with-simple-cache | clean | taken | 90% |
| F4-prod-dep-cycles-excluded | the new dpdm cycle check meets cycles inside prod deps: exclude them as a held exception, or leave lint red | clean | ruled (driver, on grant): org cycles cut via pnpm overrides; two third-party excludes held, each with a replacement | 80% |
| F5-practice-owned-jest-files-drop-repo-cuts | the practice owns the jest files exactly: how to keep every behavior main's jest config owed | clean | ruled: keep every behavior; taken via one repo seam, `jest.repo.ts`, clamped; upstream request queued | 85% |