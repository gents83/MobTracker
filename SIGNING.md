# Android Release Signing Credentials

To build and sign the release version of MobTracker for the Google Play Store, we have generated a secure release keystore.

### Keystore Location
`android/app/mobtrack-release.keystore`

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

## Quantum-Ready Hybrid App Signing & Digital Asset Links (Android 17+)

MobTracker utilizes Google Play's **Quantum-Ready Hybrid App Signing** to future-proof the application's signing identity against post-quantum cryptographic threats.

This hybrid signing scheme is natively supported starting in **Android 17**, combining classical RSA signature algorithms with post-quantum cryptography (ML-DSA-65). Under this system, Google Play signs and verifies your application using three distinct keys.

### Public Signing Certificates & Keys
For record-keeping, auditability, and API provider registrations, the public certificates for these keys are archived in the repository:
- **Location:** `android/app/certificates/`
- **Files:**
  - `deployment_cert.der` (Classical deployment key for pre-Android 17 devices)
  - `hybrid_classical_cert.der` (Classical key utilized inside the quantum-ready hybrid signature on Android 17+ devices)
  - `hybrid_pqc_cert.der` (Post-quantum ML-DSA-65 key utilized inside the quantum-ready hybrid signature on Android 17+ devices)

### Certificate Fingerprints (SHA-256)
- **Deployment Certificate (Pre-Android 17 Classical):**
  `07:5C:FE:85:CE:4B:DD:25:6C:F4:A5:5C:11:18:3A:3E:0E:8A:85:17:3E:2B:B3:65:72:56:77:4D:8A:3C:93:3D`
- **Hybrid Classical Certificate:**
  `B8:0C:70:9C:EA:88:DA:8F:CC:39:24:0E:EA:DB:5F:88:9A:AD:6D:1C:A4:20:75:01:55:D2:46:B0:D6:6A:EA:03`
- **Hybrid Post-Quantum Certificate (PQC):**
  `5E:50:BC:D1:FC:39:3D:59:67:84:5C:01:96:1E:44:66:4B:46:F9:FC:37:33:DF:43:59:09:46:9F:86:A5:40:2F`

### Digital Asset Links (Android App Links)
To ensure seamless deep linking and robust URL handling across both older and newer devices, the `assetlinks.json` file has been populated with **all three** SHA-256 fingerprints:
- **Location:** `public/.well-known/assetlinks.json`
- **Deployment Endpoint (GitHub Pages):** `/MobTracker/.well-known/assetlinks.json`

---

## iOS Signing

To sign your iOS application for the Apple App Store, open the Xcode project in `ios/App`:

1. Double-click `ios/App/App.xcworkspace` in macOS Xcode.
2. Select the `App` project in the left pane.
3. Under **Signing & Capabilities**, check **Automatically manage signing**.
4. Select your **Apple Developer Team**.
5. Set your bundle identifier to match your App Store Connect app ID.
