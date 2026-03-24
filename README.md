# Online-Event-AI
The EventAI platform is designed to simplify the entire event planning process by integrating AI-driven suggestions, budget estimation, vendor management, booking systems, and AI-based room transformation.

## GitHub Pages Deployment
This repository automatically deploys the Expo web build on every push to `main` via GitHub Actions.

- Build command: `npx expo export --platform web --output-dir web-build`
- Publish folder: `web-build`
- Live site: `https://jagetheswaren.github.io/Online-Event-AI/`

If the live site is not showing yet, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

