# Android Release Signing Credentials

To build and sign the release version of MobTracker for the Google Play Store, we have generated a secure release keystore.

### Keystore Location
`android/app/mobtrack-release.keystore`

### Credentials
* **Keystore Password:** `mobtrack123`
* **Alias:** `mobtrack-alias`
* **Key Password:** `mobtrack123`

---

## Changing / Regenerating Keystore

If you want to generate your own private signing key, run the following command:

```bash
keytool -genkeypair -v -keystore android/app/your-release.keystore -alias your-alias -keyalg RSA -keysize 2048 -validity 10000
```

## Configuring CI/CD Signing

The GitHub Actions workflow is fully configured to sign your release builds. To use these credentials securely in your CI/CD pipeline, add the following secrets to your GitHub Repository:

1. `ANDROID_KEYSTORE_BASE64` - Base64 encoded string of your `.keystore` file.
   - You can get this by running: `openssl base64 -in android/app/mobtrack-release.keystore -out keystore-base64.txt`
2. `ANDROID_KEYSTORE_PASSWORD` - `mobtrack123`
3. `ANDROID_KEY_ALIAS` - `mobtrack-alias`
4. `ANDROID_KEY_PASSWORD` - `mobtrack123`

---

## iOS Signing

To sign your iOS application for the Apple App Store, open the Xcode project in `ios/App`:

1. Double-click `ios/App/App.xcworkspace` in macOS Xcode.
2. Select the `App` project in the left pane.
3. Under **Signing & Capabilities**, check **Automatically manage signing**.
4. Select your **Apple Developer Team**.
5. Set your bundle identifier to match your App Store Connect app ID.
