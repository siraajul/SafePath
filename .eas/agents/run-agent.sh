#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ] || [ "$2" != "device" ]; then
  echo "Usage: bash .eas/agents/run-agent.sh <prompt-file> device" >&2
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "The agent prompt file does not exist." >&2
  exit 1
fi

: "${CODEX_API_KEY:?Set CODEX_API_KEY as a Secret in the EAS preview environment.}"

# This runner is for the isolated EAS device-testing job only.
exec npx --yes @openai/codex@latest exec \
  --sandbox danger-full-access \
  --skip-git-repo-check \
  - < "$1"
