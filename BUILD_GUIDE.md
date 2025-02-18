# Build Guide for Android and iOS

## Prerequisites

### For Android Build
1. Install Android Studio
2. Install Android SDK (minimum SDK 21)
3. Configure ANDROID_HOME environment variable
4. Install Java Development Kit (JDK) 11 or higher
5. Configure JAVA_HOME environment variable

### For iOS Build
1. Mac computer with macOS (required for iOS development)
2. Install Xcode (latest version recommended)
3. Install CocoaPods
4. Apple Developer account

## Android Build Process

### 1. Environment Setup
```bash
# Install Ionic CLI globally
npm install -g @ionic/cli

# Install native-run for device deployment
npm install -g native-run

# Install Android platform tools
npm install @capacitor/android
```

### 2. Prepare Android Project
```bash
# Add Android platform
ionic capacitor add android

# Copy web assets
ionic capacitor copy android

# Update Android project
ionic capacitor update android

# Sync project with Capacitor
ionic capacitor sync android
```

### 3. Build Android Project

#### Development Build
```bash
# Generate development build
ionic capacitor build android --configuration=development

# Open in Android Studio
npx cap open android
```

#### Production Build
1. Generate keystore (if not already created)
```bash
keytool -genkey -v -keystore gzhomecontrol.keystore -alias gzhomecontrol -keyalg RSA -keysize 2048 -validity 10000
```

2. Create signing configuration in Android Studio:
   - Open Android Studio
   - Go to Build > Generate Signed Bundle/APK
   - Choose APK
   - Create or select keystore
   - Fill in keystore details
   - Choose release build variant
   - Select destination folder

3. Build signed APK:
```bash
# Build production version
ionic capacitor build android --configuration=production --release

# In Android Studio:
# Build > Generate Signed Bundle/APK > APK > Choose release build
```

### 4. Android Build Variants
```bash
# Development build
ionic capacitor build android --configuration=development

# Production build
ionic capacitor build android --configuration=production

# Test build
ionic capacitor build android --configuration=test
```

## iOS Build Process

### 1. Environment Setup
```bash
# Install Ionic CLI globally
npm install -g @ionic/cli

# Install iOS platform
npm install @capacitor/ios

# Install CocoaPods (if not installed)
sudo gem install cocoapods
```

### 2. Prepare iOS Project
```bash
# Add iOS platform
ionic capacitor add ios

# Copy web assets
ionic capacitor copy ios

# Update iOS project
ionic capacitor update ios

# Sync project with Capacitor
ionic capacitor sync ios
```

### 3. Build iOS Project

#### Development Build
```bash
# Generate development build
ionic capacitor build ios --configuration=development

# Open in Xcode
npx cap open ios
```

#### Production Build
1. In Xcode:
   - Select your target
   - Choose your Team (Apple Developer Account)
   - Set Bundle Identifier
   - Set Version and Build numbers

2. Archive and Export:
   ```bash
   # Build production version
   ionic capacitor build ios --configuration=production --release
   ```
   
   In Xcode:
   - Product > Archive
   - Window > Organizer
   - Select Archive > Distribute App
   - Choose distribution method:
     - App Store Connect
     - Ad-hoc
     - Enterprise
     - Development

### 4. iOS Build Variants
```bash
# Development build
ionic capacitor build ios --configuration=development

# Production build
ionic capacitor build ios --configuration=production

# Test build
ionic capacitor build ios --configuration=test
```

## Build Configuration

### environment.ts Files
Make sure to update the appropriate environment file for your build:

- `src/environments/environment.dev.ts` for development
- `src/environments/environment.prod.ts` for production
- `src/environments/environment.test.ts` for testing

### capacitor.config.ts
Update the configuration as needed:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gozmartch.gzre',
  appName: 'gZ HomeControl',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    // Add plugin configurations here
  }
};

export default config;
```

## Troubleshooting

### Android Build Issues
1. Gradle sync fails
   ```bash
   # Clean gradle
   cd android
   ./gradlew clean
   ```

2. Build errors
   ```bash
   # Clean and rebuild
   ionic capacitor sync android
   ```

3. Plugin issues
   ```bash
   # Reinstall plugins
   npm install
   ionic capacitor sync
   ```

### iOS Build Issues
1. Pod installation fails
   ```bash
   # Clean pods
   cd ios/App
   pod deintegrate
   pod cache clean --all
   pod install
   ```

2. Signing issues
   - Verify Apple Developer account
   - Check provisioning profiles
   - Update certificates

3. Build errors
   ```bash
   # Clean and rebuild
   ionic capacitor sync ios
   ```

## Post-Build Steps

### Android
1. Test the APK on multiple devices
2. Verify app signing
3. Check Google Play Store requirements
4. Prepare store listing materials
5. Run through pre-launch report

### iOS
1. Test on multiple iOS devices
2. Verify app signing and provisioning
3. Check App Store requirements
4. Prepare App Store Connect listing
5. Run through TestFlight

## CI/CD Integration
For automated builds, consider using:
- GitHub Actions
- Bitrise
- CircleCI
- Jenkins

Example GitHub Actions workflow:
```yaml
name: Build Apps

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18.x'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build Android
      run: |
        ionic capacitor build android --configuration=production
    
    - name: Build iOS
      run: |
        ionic capacitor build ios --configuration=production
