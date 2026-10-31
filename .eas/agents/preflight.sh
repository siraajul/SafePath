#!/usr/bin/env bash
set -euo pipefail

: "${CODEX_API_KEY:?Add CODEX_API_KEY as an EAS preview Secret.}"
for option in "$@"; do
  case "$option" in
    --github)
      : "${GITHUB_TOKEN:?Add a repository-scoped GITHUB_TOKEN as an EAS preview Secret.}"
      : "${GITHUB_REPOSITORY:?Set GITHUB_REPOSITORY to siraajul/SafePath in EAS preview.}"
      [ "$GITHUB_REPOSITORY" = siraajul/SafePath ] || { echo "Unexpected GitHub repository." >&2; exit 1; }
      ;;
    --simulator)
      : "${EXPO_TOKEN_SIMULATOR:?Add EXPO_TOKEN_SIMULATOR as an EAS preview Secret.}"
      env -u CODEX_API_KEY -u GITHUB_TOKEN EXPO_TOKEN="$EXPO_TOKEN_SIMULATOR" \
        npx --yes eas-cli@latest simulator:availability --json --non-interactive \
        > /tmp/simulator-availability.json
      node -e 'const result = require("/tmp/simulator-availability.json"); if (result.available !== true) { console.error("Expo Simulators access is required: https://expo.dev/services/simulators"); process.exit(1); }'
      ;;
    *) echo "Unknown preflight option: $option" >&2; exit 1 ;;
  esac
done
