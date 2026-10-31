#!/usr/bin/env bash
set -euo pipefail

: "${ISSUE_NUMBER:?Pass -F issue_number=<number>.}"
[[ "$ISSUE_NUMBER" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid issue number." >&2; exit 1; }
bash .eas/agents/preflight.sh --github
export PATH="$HOME/.local/bin:$PATH"
command -v but > /dev/null

PROJECT_DIR=$(pwd)
REPO_DIR=$(git rev-parse --show-toplevel)
APP_PATH=$(git rev-parse --show-prefix)
WORK_DIR=/tmp/agent-change
APP_DIR="$WORK_DIR/$APP_PATH"
RUN_ID=$(node -e 'console.log(require("node:crypto").randomUUID())')
BRANCH="agent/issue-$ISSUE_NUMBER-$RUN_ID"
GITHUB_HELPER="$PROJECT_DIR/.eas/agents/github.mjs"

# GitButler has no clone command. Bootstrap a disposable clone without putting
# credentials in the remote URL, then use but for commits and pushes.
cat > /tmp/safepath-git-askpass.sh <<'ASKPASS'
#!/usr/bin/env sh
case "$1" in
  *Username*) printf '%s\n' x-access-token ;;
  *Password*) printf '%s\n' "$GITHUB_TOKEN" ;;
  *) exit 1 ;;
esac
ASKPASS
chmod 700 /tmp/safepath-git-askpass.sh
export GIT_ASKPASS=/tmp/safepath-git-askpass.sh
export GIT_TERMINAL_PROMPT=0

git clone --depth 1 "https://github.com/${GITHUB_REPOSITORY}.git" "$WORK_DIR"
ln -s "$REPO_DIR/node_modules" "$WORK_DIR/node_modules"
printf 'node_modules\nagent-output/\n' >> "$WORK_DIR/.git/info/exclude"
mkdir -p "$APP_DIR/agent-output"

{
  cat .eas/agents/make-change.md
  printf '\n## Issue #%s\n\n' "$ISSUE_NUMBER"
  node "$GITHUB_HELPER" issue "$ISSUE_NUMBER"
} > "$APP_DIR/agent-output/prompt.md"

cd "$APP_DIR"
# A failed or timed-out agent never publishes a partial change.
env -u EXPO_TOKEN -u EXPO_TOKEN_SIMULATOR -u GITHUB_TOKEN -u GIT_ASKPASS \
  timeout 20m bash .eas/agents/run-agent.sh agent-output/prompt.md change

if [ -n "$(git -C "$WORK_DIR" status --porcelain -- "${APP_PATH}.eas" .github "${APP_PATH}AGENTS.md" "${APP_PATH}package.json" "${APP_PATH}package-lock.json")" ]; then
  echo "The agent changed protected workflow, instruction, or dependency files. Nothing will be published." >&2
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  {
    printf '## Issue to PR\n\nThe agent did not change any file.\n\n'
    cat agent-output/summary.md 2> /dev/null || true
  } > /tmp/comment.md
  node "$GITHUB_HELPER" comment "$ISSUE_NUMBER" /tmp/comment.md
  exit 1
fi

TITLE=$(head -n 1 agent-output/summary.md 2> /dev/null || true)
TITLE=${TITLE:-"feat(app): address issue #$ISSUE_NUMBER"}
{
  tail -n +2 agent-output/summary.md 2> /dev/null || true
  printf '\n\nCloses #%s\n' "$ISSUE_NUMBER"
} > /tmp/pull-request.md

export GIT_AUTHOR_NAME="EAS agent"
export GIT_COMMITTER_NAME="EAS agent"
GIT_AUTHOR_EMAIL=$(node "$GITHUB_HELPER" author-email)
export GIT_AUTHOR_EMAIL
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
but commit -b "$BRANCH" -m "$TITLE"
but config push-remote origin
but push "$BRANCH"
PR_URL=$(node "$GITHUB_HELPER" open-pull-request "$BRANCH" "$TITLE" /tmp/pull-request.md)

printf '## Issue to PR\n\nThe agent opened draft PR %s. Mark it ready for review to run Agentic CI.\n' "$PR_URL" > /tmp/comment.md
node "$GITHUB_HELPER" comment "$ISSUE_NUMBER" /tmp/comment.md
