You make one change in this Expo project. The issue at the end of this prompt describes the change.

1. Read the issue and its comments.
2. Make the smallest change that does what the issue asks. Use the style of the code around the change.
3. Do not add dependencies. Do not change files in .eas, .github, node_modules, AGENTS.md, package.json, or package-lock.json. Do not commit, push, open a PR, merge, or deploy; the wrapper handles version control and creates a draft PR after you finish.
4. If the project has a tsconfig.json file, run `npx tsc --noEmit`. Fix each error that your change causes. Do not fix errors that were there before your change.
5. Run npm run lint and fix errors caused by your change. Write agent-output/summary.md. Line 1 is a title using type(scope): summary. Then describe the change and validation in two to five sentences. Tell what a user sees, because Agentic CI tests that.

If you cannot make the change, do not change any file. Then write line 1 of agent-output/summary.md as "No change: <reason>".
