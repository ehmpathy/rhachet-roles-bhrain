# F2 — the daemon reads a focus file, not the branch bind

- **fork**: (a) the drive writes `…session=<token>.focus`; the tick reads it · (b) the tick calls `getRouteBindByBranch` itself · (c) the drive respawns the daemon with a new `--route` on each switch
- **taken**: (a). the drive is the one place that knows the route the clone drives now (`stepRouteDrive.ts:90` reads explicit `--route`, else the bind). (b) throws on a multi-bind (`MESSAGE_OF_MULTI_BIND`) and misses an explicit `--route` drive. (c) opens a window with zero or two daemons per switch, the race the findsert exists to close
- **rework**: clean — the focus read is one leaf the tick calls
- **confidence**: 85% — below 93% because the surdirector patch could not be read to compare its shape
- **where**: `1.vision.yield.md` · the solution, move 2
