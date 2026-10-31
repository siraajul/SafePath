# SafePath agentic workflows

> **Disabled optional configuration.** The active pipeline is [standard QA without an AI API key](qa.md). EAS YAML files are archived in `.eas/disabled-workflows/`; the issue-label bridge is in `.github/disabled-workflows/`. Restore them to their original workflow directories only if you later provision the credentials and choose to enable AI automation. The instructions below describe that optional setup.

All four Expo workflow types are configured using Codex and agent-device. This is configuration and local validation; no live cloud build, simulator session, agent run, issue comment, or generated PR has been run as part of setup.

| Workflow | Files | Trigger and result |
| --- | --- | --- |
| Agentic CI | `agentic-ci.yml`, `agentic-ci-android.yml` | A non-draft PR to `main` tests its described behavior on iOS and Android, uploads screenshots, and comments with the verdict and recording. |
| QA Swarm | `qa-swarm.yml` | A manual run starts four independent device lanes: launch and navigation on each platform. It produces an aggregate report and optionally comments on a PR. |
| Issue to PR | `issue-to-pr.yml`, `.github/workflows/agent-label.yml` | Adding the `agent` label to an issue starts a code-change job. It opens a **draft** PR; mark it ready to trigger Agentic CI. |
| Bug Triage | `bug-triage.yml`, `bug-triage-android.yml` | A manual issue number reproduces the report on either platform. The iOS workflow also accepts TestFlight screenshot/crash feedback and files an issue. |

EAS workflow files live in `.eas/workflows/`. Helpers and prompts live in `.eas/agents/`. QA flows in `.eas/qa-flows/` match the current Home/Explore starter screens; update them when the product screens change.

## Project and verified setup

- EAS: [@siraajul/SafePath](https://expo.dev/accounts/siraajul/projects/SafePath), project ID `16a57610-19a0-42b6-aeb6-0d0d6f34b3ab`.
- GitHub: [siraajul/SafePath](https://github.com/siraajul/SafePath).
- iOS bundle ID and Android package: `com.siraajul.safepath`.
- `preview` builds unsigned iOS simulator apps and Android APKs. The empty `production` submit profile is reserved for the eventual App Store Connect credentials; it does not submit anything.
- Checked October 31, 2026: Expo Simulators returned `available: false`; EAS preview had no `CODEX_API_KEY` or `EXPO_TOKEN_SIMULATOR`.
- Setup created the GitHub labels `agent` and `testflight`; `bug` already existed. `GITHUB_REPOSITORY=siraajul/SafePath` is configured as plain text in EAS preview.
- GitHub-to-EAS integration remains a dashboard step. A Git remote alone does not connect GitHub events. Browser access was unavailable during setup.

## Finish activation

1. Request [Expo Simulators preview access](https://expo.dev/services/simulators). A paid plan alone does not grant access. Verify that this command returns `available: true` for the project account:

   ```bash
   npx --yes eas-cli@latest simulator:availability --json --non-interactive
   ```

2. In the EAS project dashboard, open Project settings > GitHub, install or authorize the Expo GitHub app for **only** `siraajul/SafePath`, and connect it. Use the repository root as the base directory.

3. Add these credentials directly in the relevant service. Do not paste their values into chat or commit them:

   | Destination | Name | Value and scope |
   | --- | --- | --- |
   | EAS preview, Secret | `CODEX_API_KEY` | A dedicated OpenAI API key with an appropriate spending limit. API usage is billed separately from this interactive Codex session. |
   | EAS preview, Secret | `EXPO_TOKEN_SIMULATOR` | An Expo robot-user token with the Developer role in the project-owning account. |
   | EAS preview, Secret | `GITHUB_TOKEN` | A fine-grained GitHub token for **only this repository**, with Contents, Issues, and Pull requests read/write permissions. Needed for Issue to PR, Bug Triage, and optional QA PR comments. |
   | GitHub repository Actions secret | `EXPO_TOKEN` | A second token for the Expo robot user, used by the issue-label bridge to start EAS workflows. |

   Keep unrelated secrets out of preview. Jobs and repository-controlled code can read that environment. Run these workflows only for trusted PRs/issues; EAS excludes fork PRs from PR-triggered workflows. A separate GitHub bot account preserves your ability to approve its PRs.

4. Configure the Android keystore before the first Android build:

   ```bash
   npx --yes eas-cli@latest credentials:configure-build -p android -e preview
   ```

   iOS simulator builds do not require Apple signing credentials.

5. For **TestFlight intake**, also connect the real App Store Connect app in the EAS project's General > Connections settings, and configure its App Store Connect API key under the `production` submit profile with `npx --yes eas-cli@latest credentials --platform ios`. This requires Apple Developer membership and an existing TestFlight app/build. The callback configuration alone cannot provide those accounts or credentials. Feedback filed before connecting does not trigger the workflow. Imported issues contain the feedback, screenshot links, and any crash log; explicit tester name/email fields are omitted.

6. Publish and review the configuration branch, then merge it into `main`. Neither this setup nor the workflows merge/deploy changes automatically. Draft PRs skip Agentic CI until marked ready for review.

Preflight jobs stop before native builds when simulator access or the required credentials are missing. Issue to PR checks its GitHub/API credentials; it can prepare a draft change before device testing becomes available.

## Run commands

Run after activation and after the files are on the selected GitHub ref. The examples use issue/PR number **123**; replace it with a real number.

```bash
# Four device lanes, without posting a GitHub comment:
npx --yes eas-cli@latest workflow:run .eas/workflows/qa-swarm.yml --ref main

# Optionally attach the QA report to PR 123:
npx --yes eas-cli@latest workflow:run .eas/workflows/qa-swarm.yml --ref main -F pr_number=123

# Reproduce issue 123 on iOS or Android:
npx --yes eas-cli@latest workflow:run .eas/workflows/bug-triage.yml --ref main -F issue_number=123
npx --yes eas-cli@latest workflow:run .eas/workflows/bug-triage-android.yml --ref main -F issue_number=123

# Prepare a draft change for issue 123 without applying a label:
npx --yes eas-cli@latest workflow:run .eas/workflows/issue-to-pr.yml --ref main -F issue_number=123
```

The GitHub label trigger must be on the default branch and needs its Actions secret. Read the issue before applying `agent`. TestFlight events must arrive after the App Store Connect connection is active.

## Evidence, limits, and publishing

- QA Swarm saves screenshots and verdicts as EAS artifacts and links to session recordings. It does **not** publish a public EAS Hosting evidence website or run a third-party evidence publisher.
- Each device session has a 30-minute limit. QA agents have 15 minutes per lane; PR and bug agents have 20 minutes. Four QA lanes use four simulator sessions and model budgets.
- Issue to PR uses GitButler for commits and pushes in a disposable clone. Git is used only to bootstrap the clone and inspect it, since GitButler has no clone command. The job installs the CLI from the official GitButler installer when needed.
- Code-change jobs use unique branches, do not force-push, and do not publish after an agent failure/timeout or edits to workflow, instruction, or dependency files. The GitHub helper opens a draft PR for human review.
- The shared Codex runner supports `device` and `change` modes in an isolated EAS job. Prompt text limits each role; the broader sandbox setting from Expo's guide is not a security boundary against a malicious agent.
- `.env.eas-simulator` and `agent-output/` are ignored by Git. Do not make the AI verdict a required check until real runs have been reviewed.

## Local checks

All six EAS files must pass `npx --yes eas-cli@latest workflow:validate <path> --non-interactive`. This checks configuration without starting jobs.

```bash
npm run test:workflows
npm run lint
npm run typecheck
```

The workflow tests mock GitHub and verify draft PR creation, rejected destinations/IDs, credential redaction, missing-secret failures, and TestFlight identity-field omission. They do not claim live GitHub, EAS, App Store Connect, simulator, or publishing acceptance.

Sources: [Expo setup](https://docs.expo.dev/agentic-workflows/setup/), [Agentic CI](https://docs.expo.dev/agentic-workflows/agentic-ci/), [QA Swarm](https://docs.expo.dev/agentic-workflows/qa-swarm/), [Issue to PR](https://docs.expo.dev/agentic-workflows/issue-to-pr/), [Bug Triage](https://docs.expo.dev/agentic-workflows/bug-triage/).
