# SafePath Agentic CI

SafePath uses the [official Expo Agentic CI workflow](https://docs.expo.dev/agentic-workflows/agentic-ci/) for iOS, with Codex and agent-device. It tests the behaviors described in a ready-for-review PR targeting `main`, saves a verdict and screenshots, and posts evidence links on that PR. It does not merge or deploy.

## Project

- EAS project: [@siraajul/SafePath](https://expo.dev/accounts/siraajul/projects/SafePath)
- EAS project ID: `16a57610-19a0-42b6-aeb6-0d0d6f34b3ab`
- Repository: [siraajul/SafePath](https://github.com/siraajul/SafePath)
- iOS bundle ID and Android package: `com.siraajul.safepath`
- Build profile: `preview`. It makes unsigned iOS simulator builds and Android APKs. Only iOS Agentic CI is configured; Android builds also require an EAS keystore.

## Verified setup status

Checked on October 31, 2026:

- Expo CLI is authenticated as `siraajul` and this app is linked to EAS.
- The Expo Simulators availability API returned `available: false` for the account.
- Neither `CODEX_API_KEY` nor `EXPO_TOKEN_SIMULATOR` is configured in the EAS preview environment.
- GitHub-to-EAS integration still needs connecting in the dashboard. A Git remote alone does not connect GitHub events to EAS.
- No cloud build, simulator session, or model run has been started.

## Finish activation

1. Request [Expo Simulators preview access](https://expo.dev/services/simulators). A paid plan alone does not grant access. Once access is granted, run:

   ```bash
   npx --yes eas-cli@latest simulator:availability --json --non-interactive
   ```

   It must return `available: true` for the project account.

2. In the project's EAS dashboard, go to Project settings > GitHub, install or authorize the Expo GitHub app for **only** `siraajul/SafePath`, then connect that repository. Keep the base directory at the repository root.

3. Create an Expo robot user with the **Developer** role in the project-owning account, then create its access token. Add it directly in the project's EAS Environment variables page with name `EXPO_TOKEN_SIMULATOR`, environment **preview**, visibility **Secret**.

4. Create a dedicated OpenAI API key with an appropriate spending limit. Add it directly in EAS as `CODEX_API_KEY`, environment **preview**, visibility **Secret**. This CI run uses API billing, separately from this interactive Codex session. Keep the key and robot token out of chat, source files, and logs.

   This workflow runs repository code and a coding agent. Keep unrelated secrets out of preview, and run it only for trusted PRs. EAS does not run PR workflows from forks. The Codex runner uses the broader sandbox mode from Expo's guide inside the isolated EAS job, and supports device testing only.

5. Publish the configuration branch and merge it into `main` after review. This setup does not publish the branch automatically.

6. Open a PR with a visible app change and describe the behavior clearly. Keep it as a draft until ready to spend build/simulator time and model tokens; marking it ready triggers the workflow. The device session is limited to 30 minutes and the agent command to 20 minutes. Read the evidence before making this check required.

The preflight job stops before builds when credentials or simulator access are missing. It does not grant access or create missing credentials.

## Files and checks

- `.eas/workflows/agentic-ci.yml`: preflight, fingerprint, find/build/repack, device check, evidence upload, PR comment, and verdict gate.
- `.eas/agents/run-agent.sh`: non-interactive Codex runner.
- `.eas/agents/start-session.sh`: official agent-device session controller and cleanup trap.
- `.eas/agents/check-pr.md`: test instructions and evidence format.
- `.eas/agents/app-facts.md`: facts about the current starter app.
- `eas.json`: simulator/APK preview profile.

Validate locally without starting a build:

```bash
npx --yes eas-cli@latest workflow:validate .eas/workflows/agentic-ci.yml --non-interactive
bash -n .eas/agents/run-agent.sh
bash -n .eas/agents/start-session.sh
npm run lint
npm run typecheck
```

The generated `.env.eas-simulator` credential file and `agent-output/` evidence are ignored by Git.
