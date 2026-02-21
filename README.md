<h1 align="center">
  <img alt="logo" src="./assets/icon.png" width="124px" style="border-radius:10px"/><br/>
Mobile App </h1>

> This Project is based on [Obytes starter](https://starter.obytes.com)

## Requirements

- [React Native dev environment ](https://reactnative.dev/docs/environment-setup)
- [Node.js LTS release](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall), required only for macOS or Linux users
- [Pnpm](https://pnpm.io/installation)
- [Cursor](https://www.cursor.com/) or [VS Code Editor](https://code.visualstudio.com/download) ⚠️ Make sure to install all recommended extension from `.vscode/extensions.json`

## 👋 Quick start

This app uses a **custom development client** (not Expo Go). It depends on native modules (e.g. react-native-mmkv, react-native-worklets, Moti) that require a native build. Use **prebuild** and **run:ios** / **run:android** as below.

Clone the repo and install deps:

```sh
git clone https://github.com/user/repo-name
cd ./repo-name
pnpm install
```

Generate native projects and run on iOS:

```sh
pnpm expo prebuild
pnpm expo run:ios
```

Or use the shortcut (runs `expo run:ios`, which implies a native build):

```sh
pnpm ios
```

Run on Android:

```sh
pnpm expo prebuild
pnpm expo run:android
```

Or:

```sh
pnpm android
```

After the first `expo prebuild`, you can use `pnpm ios` or `pnpm android` for subsequent runs unless you change native deps.

## ✍️ Documentation

- [Rules and Conventions](https://starter.obytes.com/getting-started/rules-and-conventions/)
- [Project structure](https://starter.obytes.com/getting-started/project-structure)
- [Environment vars and config](https://starter.obytes.com/getting-started/environment-vars-config)
- [UI and Theming](https://starter.obytes.com/ui-and-theme/ui-theming)
- [Components](https://starter.obytes.com/ui-and-theme/components)
- [Forms](https://starter.obytes.com/ui-and-theme/Forms)
- [Data fetching](https://starter.obytes.com/guides/data-fetching)
- [Contribute to starter](https://starter.obytes.com/how-to-contribute/)
