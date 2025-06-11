# Mutuals React Native App

A social networking app for planning hangouts with 1st and 2nd-degree connections.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Java Development Kit (JDK 11)

### Installation

1. **Clone and install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Install iOS dependencies (if developing for iOS):**
\`\`\`bash
cd ios && pod install && cd ..
\`\`\`

3. **Android Setup:**
   - Open Android Studio
   - Install Android SDK (API level 31 or higher)
   - Create an Android Virtual Device (AVD)

### Running the App

1. **Start Metro bundler:**
\`\`\`bash
npm start
\`\`\`

2. **Run on Android:**
\`\`\`bash
npm run android
\`\`\`

3. **Run on iOS:**
\`\`\`bash
npm run ios
\`\`\`

### Building APK

1. **Generate a signing key:**
\`\`\`bash
cd android/app
keytool -genkeypair -v -storename my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

2. **Configure signing in android/gradle.properties:**
\`\`\`
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
\`\`\`

3. **Build release APK:**
\`\`\`bash
cd android
./gradlew assembleRelease
\`\`\`

The APK will be generated at: `android/app/build/outputs/apk/release/app-release.apk`

## Features

- 📱 Mobile-optimized authentication with OTP
- 👤 Profile creation with photo upload
- 🗺️ Interactive network graph (Google Maps style)
- 👥 1st and 2nd-degree connection management
- 🎉 Hangout planning with approval workflows
- 🔔 Notification system

## Project Structure

\`\`\`
src/
├── components/          # Reusable components
├── screens/            # Main app screens
├── utils/              # Helper functions
└── types/              # TypeScript type definitions
\`\`\`

## API Integration

The app is designed to work with a backend API. Update the API endpoints in the components to connect to your server.

## Permissions

The app requires the following permissions:
- Camera (for profile photos)
- Storage (for photo access)
- Internet (for API calls)
