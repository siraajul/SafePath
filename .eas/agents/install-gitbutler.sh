#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
if ! command -v but > /dev/null 2>&1; then
  curl -fsSL https://gitbutler.com/install.sh -o /tmp/gitbutler-install.sh
  GITBUTLER_NONINTERACTIVE=1 sh /tmp/gitbutler-install.sh
fi
command -v but > /dev/null
