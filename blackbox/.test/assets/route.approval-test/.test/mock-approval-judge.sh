#!/usr/bin/env bash
# mock judge for approval test: exits 2 with approval-required message
echo "passed: false"
echo "reason: wait for human approval"
echo ""
echo "✋ halted, human approval required"
echo "   ├─ please ask your human to"
echo "   │  └─ rhx route.stone.set --stone 1.vision --as approved"
echo "   │"
echo "   └─ after human approves, run"
echo "      └─ rhx route.stone.set --stone 1.vision --as passed"
exit 2
