# Event AI Flutter Starter

This folder now contains a Flutter starter app wired to:

- `lib/main.dart`
- `lib/online_event_ai_app.dart`
- `lib/ai_module_screens.dart`

Included module screens:

- AI Event DNA Generator
- AI Budget Forecaster
- AI Auto Event Generator
- AI Vendor Price Evaluator
- AI Negotiation Message Generator
- AI Event Day Smart Assistant
- AI Decor Variation Generator
- AI Post-Event Analysis Generator
- AI Personalized Vendor Recommendation
- AI Risk Predictor

Each screen now has:

- real input form fields
- Generate JSON action
- shared API service call
- rendered JSON response panel

## Run

1. Install Flutter SDK and add `flutter` to PATH.
2. Open terminal in `flutter/`.
3. Run:

```bash
flutter pub get
flutter run
```

## If platform folders are missing

Generate them once:

```bash
flutter create .
```

## Optional API endpoint override

Default endpoint is:

- `https://toolkit.rork.com/llm/text`

Override it at run time:

```bash
flutter run --dart-define=EVENT_AI_ENDPOINT=https://your-api-url
```
