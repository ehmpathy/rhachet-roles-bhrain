cont(driver): a status line repaint with no change costs no fresh cpu

- add the isolated subpath cli/route.status.line; a hit loads only leaf modules
- cache the line per branch under .agent/.cache/, keyed by a stat fingerprint of the
  render inputs, at most 30s old; a passage, meter row, promise, or route.bind.set shows
  on the next repaint
- the legacy cli/route export forwards to the cached entry
- the driver init writes the subpath command into each seat's settings
- clamp: the render runs once across 5 unchanged repaints; with the hit disabled, 7 of 57 fail
- bench, final build: subpath warm 0.059s vs legacy miss 0.967s cpu per repaint (~16x)
- the consumer patch carries dist .js only; a changed role asset is left out and named, since
  pnpm cannot patch a read-only file; rhx prove.consumer-patch installs it and repaints twice
- cure pr #700's reds: openrouter 0.1.4 re-pin and its fallback test; rhachet 1.50.1
  key-absent snapshots
- review suites commit the role link output, so scope counts no longer measure the host
- pave rhx route.status.line.show, rhx settings.permissions.diff, rhx gen.consumer-patch,
  rhx prove.consumer-patch, rhx bench.status-line
