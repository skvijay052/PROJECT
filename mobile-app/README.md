# Bandhanaa Mobile App

An Expo React Native app for the Bandhanaa matchmaking platform.

## Local Run

1. Install packages:

```bash
npm install
```

2. Create or update `.env` with your real values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api/v1
EXPO_PUBLIC_AUTH_REDIRECT_URL=bandhanaa://auth/callback
```

3. Start Expo:

```bash
npx expo start --clear --lan
```

## Android Build

This project includes [eas.json](/d:/PROJECT/mobile-app/eas.json:1) for EAS builds.

Before the first production build, update [app.json](/d:/PROJECT/mobile-app/app.json:1) with your own unique app identifiers:

```json
{
  "expo": {
    "name": "Bandhanaa",
    "slug": "bandhanaa",
    "android": {
      "package": "com.yourname.bandhanaa"
    },
    "ios": {
      "bundleIdentifier": "com.yourname.bandhanaa"
    }
  }
}
```

Install EAS and log in:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Build an installable Android APK:

```bash
eas build -p android --profile preview
```

Build an Android App Bundle for Play Store upload:

```bash
eas build -p android --profile production
```

## Important Release Notes

- Do not use `127.0.0.1`, `10.0.2.2`, or `192.168.x.x` in release builds.
- `EXPO_PUBLIC_API_BASE_URL` must point to your deployed backend URL.
- Keep only the Supabase `anon` key in the app.
- Never put the Supabase `service_role` key in the app.
