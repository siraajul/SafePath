# SafePath

Expo SDK 58 starter with TypeScript and Expo Router, created with the official default template. App screens live in `src/app/`.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

Use `npm run web` for the browser, `npm run ios` for the iOS simulator, or `npm run android` for an Android emulator. During the SDK 58 transition, the store version of Expo Go may still require SDK 57; use a matching Expo Go client or a development build for SDK 58.

Run `npm run lint` and `npm run typecheck` before committing. `npm run export:web` verifies the production web bundle.

## Local AI tools

The Expo plugin and remote MCP server are configured in Codex. Run `npm run start:mcp` to expose this project's local MCP capabilities, using the same Expo account as the remote MCP connection. Reconnect the MCP server or start a new Codex chat after starting Metro.

The local `expo-mcp` package uses the patched 0.3.1 release instead of SDK 58's suggested 0.2.x version, which pulls in high-severity dependency advisories. It is excluded from Expo's automatic version alignment so `expo install --fix` preserves that choice.

EAS cloud workflows are not linked or activated yet. They require an EAS project, a connected GitHub repository, CI agent credentials, and Expo Simulators preview access. Session credentials and generated agent evidence are excluded from version control.

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
