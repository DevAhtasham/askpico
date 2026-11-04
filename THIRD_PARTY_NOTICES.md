# Third-Party Notices

Pico includes and builds on third-party software. Each component keeps the license it was published under. The proprietary license in [LICENSE](LICENSE) does not apply to these components.

## 1. BetterChatGPT (CC0 1.0 Universal)

The web application in `apps/web/` is derived from [BetterChatGPT](https://github.com/ztjhz/BetterChatGPT) by Jing Hua and contributors. BetterChatGPT is released under CC0 1.0 Universal. The full license text is in [`licenses/CC0-1.0-BetterChatGPT.txt`](licenses/CC0-1.0-BetterChatGPT.txt).

Under CC0, the original BetterChatGPT code may be used, copied, and modified by anyone without restriction and without attribution. This notice is provided for transparency. It does not limit the copyright holder's rights in the code that Pico added.

## 2. npm packages

Dependencies declared in `apps/web/package.json` and `services/api/package.json` are installed from npm. Each package is licensed by its authors. The exact versions and licenses are recorded in the lock files (`apps/web/yarn.lock`, `services/api/package-lock.json`). Run `yarn licenses list` or `npm ls --all` to review the full list before any distribution.

## 3. Assets and services

- Stock photos from Pexels and Pixabay are subject to their respective license terms and attribution rules.
- Google Drive sync, Google sign-in, Gemini, OpenRouter, and other APIs are subject to their own terms of service.
- Any third-party icon, font, or illustration added to the project must be listed here with its license.
