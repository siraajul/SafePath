# QA without an AI API key

The active workflow is `.github/workflows/qa.yml`. It runs on pushes, pull requests to `main`, and manual GitHub Actions dispatches.

It needs no OpenAI key, Expo token, Apple account, or cloud simulator preview access. GitHub Actions usage remains subject to your account's normal runner allowance and billing; this is not a promise of unlimited free compute.

## Checks

1. Install locked dependencies with `npm ci` on Node.js 22.
2. Lint and TypeScript checks.
3. Six workflow-helper regression tests using mocked GitHub responses; no live API calls.
4. Production web export.
5. Playwright smoke tests in desktop Chromium and mobile Chromium: Home content, Home/Explore navigation, and expanding/collapsing routing details.
6. Upload the HTML report, screenshots, and failure traces to the workflow's `qa-results` artifact for 14 days.

These browser checks cover the web app at desktop and mobile viewport sizes. They do not establish native iOS/Android, physical-device, or store-release acceptance.

## Run locally

```bash
npm ci
npx playwright install chromium
npm run qa
```

For browser tests alone, use `npm run test:web`. Playwright starts an offline Expo web server on port 8090 and stops it when the run finishes. It does not enable the local MCP tunnel.

## Activate on GitHub

Push the configuration commit to your branch. Open its Actions tab to view the QA run. Merge into `main` after review to make it the default-branch QA workflow. This setup does not publish or merge the commit automatically.

The six AI EAS workflows and the issue-label trigger are archived outside their active directories, so ordinary PRs, issue labels, and TestFlight events will not start them from this revision. Already-running jobs or runs of an older commit are unaffected. Their optional setup remains documented in [the archived agentic guide](agentic-ci.md).
