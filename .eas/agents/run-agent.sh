#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: bash .eas/agents/run-agent.sh <prompt-file> <device|change>" >&2
  exit 1
fi
case "$2" in
  device|change) ;;
  *) echo "Unknown agent mode: $2" >&2; exit 1 ;;
esac

if [ ! -f "$1" ]; then
  echo "The agent prompt file does not exist." >&2
  exit 1
fi

: "${CODEX_API_KEY:?Set CODEX_API_KEY as a Secret in the EAS preview environment.}"

# Runs only inside an isolated EAS job. Change mode is published by the wrapper,
# which checks the changed paths and opens a draft PR for human review.
exec npx --yes @openai/codex@latest exec \
  --sandbox danger-full-access \
  --skip-git-repo-check \
  - < "$1"
