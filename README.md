# Tewter Mobile App

React Native (Expo) mobile app for Tewter - Learn Faster, Practice Smarter.

## Features

- **Math Practice** - Practice algebra, calculus, and more with step-by-step guidance
- **Mental Math** - Speed arithmetic challenges with streak bonuses
- **Problem Upload** - Take a photo of any math problem and get instant solutions
- **Leaderboards** - Compete with other users globally
- **Multiplayer** - Challenge friends in real-time math and typing races

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository and navigate to the mobile app:
   ```bash
   cd tewter-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_API_URL=https://tewter.vercel.app
   ```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS Simulator (Mac only)
npm run ios

# Run on Android Emulator
npm run android

# Run on web browser
npm run web
```

### Running on Physical Device

1. Install the **Expo Go** app on your phone
2. Run `npm start`
3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## Project Structure

```
tewter-mobile/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── src/
│   ├── components/        # Reusable UI components
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── constants/
│   │   └── theme.ts       # Colors, spacing, typography
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication state
│   ├── lib/
│   │   └── supabase.ts    # Supabase client
│   ├── navigation/
│   │   └── AppNavigator.tsx # Navigation setup
│   └── screens/
│       ├── HomeScreen.tsx
│       ├── PracticeScreen.tsx
│       ├── ArithmeticScreen.tsx
│       ├── UploadScreen.tsx
│       ├── LeaderboardScreen.tsx
│       ├── MultiplayerScreen.tsx
│       ├── ProfileScreen.tsx
│       └── AuthScreen.tsx
└── assets/                # App icons and images
```

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to Expo:
   ```bash
   eas login
   ```

3. Configure your project:
   ```bash
   eas build:configure
   ```

4. Build for iOS:
   ```bash
   eas build --platform ios
   ```

5. Build for Android:
   ```bash
   eas build --platform android
   ```

## API Integration

The mobile app connects to the same backend as the web app:
- **Supabase** for authentication and database
- **Tewter API** for problem generation and leaderboards

All API endpoints are shared between web and mobile platforms.

## Tech Stack

- **Expo** - React Native framework
- **React Navigation** - Navigation library
- **Supabase** - Backend and authentication
- **Expo Camera** - Camera integration for problem upload
- **Expo Image Picker** - Photo library access
