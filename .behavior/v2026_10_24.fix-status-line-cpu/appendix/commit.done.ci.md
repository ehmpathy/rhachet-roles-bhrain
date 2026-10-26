cont(driver): cure the done gate's acceptance red, and pave the pr body set

- settings.permissions.diff drops jq 1.7's `jq: ` prefix from a json cause, so its refusal
  reads the same on every host; ci's jq failed acceptance shard 1/3 on it
- pave rhx pr.body.set, which sets a pr's body from the route's appendix/pr.body.md, with
  its help and refusals snapped
- boot.yml keeps both done-gate skills and the pnpm-patch hazard out of the boot, so the
  24,000-token cap holds
