import * as path from 'path';

/**
 * .what = test fixtures path for route operations
 * .why = centralizes path resolution for test assets
 */
export const ASSETS_DIR = path.join(__dirname, 'assets');

/**
 * .what = route fixture paths
 * .why = enables consistent reference to test fixtures
 */
export const FIXTURES = {
  simple: path.join(ASSETS_DIR, 'route.simple'),
  parallel: path.join(ASSETS_DIR, 'route.parallel'),
  guarded: path.join(ASSETS_DIR, 'route.guarded'),
  approved: path.join(ASSETS_DIR, 'route.approved'),
  reviewed: path.join(ASSETS_DIR, 'route.reviewed'),
  alternate: path.join(ASSETS_DIR, 'route.alternate'),
} as const;
