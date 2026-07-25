# 🎯 MobTracker

[![Build and Deploy (Web & Native Mobile)](https://github.com/gents83/MobTracker/actions/workflows/build-and-deploy.yml/badge.svg)](https://github.com/gents83/MobTracker/actions/workflows/build-and-deploy.yml)
[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-GitHub%20Pages-blue?style=flat&logo=github)](https://gents83.github.io/MobTracker/)
[![Platform](https://img.shields.io/badge/Platforms-Web%20%7C%20Android%20%7C%20iOS-brightgreen?style=flat)](https://github.com/gents83/MobTracker)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**MobTracker (MOBTRACK_OS)** is a state-of-the-art, offline-first hybrid mobile and web application built with **React**, **TypeScript**, and **Capacitor**. It acts as both a tactical, offline-capable phone region lookup utility and a secure, serverless peer-to-peer device tracking system using public, lightweight pub/sub message relays.

Developed as a single-page application (SPA), MobTracker compiles seamlessly into standard web assets hosted on **GitHub Pages**, as well as native **Android** and **iOS** packages.

---

## 🔗 Key Links & Live Services

| Asset / Page | Description | Link |
|:---|:---|:---|
| 🌐 **Live Web Application** | Open and use MobTracker directly in your browser. | [Open MobTracker on GitHub Pages](https://gents83.github.io/MobTracker/) |
| 📦 **Latest GitHub Releases** | View tags, change logs, and build outputs. | [MobTracker Releases](https://github.com/gents83/MobTracker/releases) |
| 🤖 **Android Signed APK** | Direct download of the store-ready standalone installer. | [Download app-release.apk](https://github.com/gents83/MobTracker/releases/latest/download/app-release.apk) |
| 📦 **Android App Bundle (AAB)** | Direct download for publishing to the Google Play Store. | [Download app-release.aab](https://github.com/gents83/MobTracker/releases/latest/download/app-release.aab) |
| 🍎 **iOS Project Structure** | Direct download of the pre-configured Xcode workspace. | [Download mobtracker-ios-project.zip](https://github.com/gents83/MobTracker/releases/latest/download/mobtracker-ios-project.zip) |
| 🔑 **Signing Credentials** | Android release signing and Xcode capabilities guide. | [Read SIGNING.md](SIGNING.md) |

---

## 🚀 Key Features & Modes of Operation

MobTracker operates in two distinct, powerful modes, fully optimized for both desktop/mobile web browsers and native sandboxed devices:

### 1. 🔍 Offline Region Locator (Prefix Triangulation)
Real-time, arbitrary pinpoint tracking via phone numbers is legally restricted and technically impossible without carrier SS7 signaling/operator-level access. MobTracker provides a comprehensive **Offline Region Locator** that visualizes phone registration metadata client-side.
* **100% Offline-First Lookup:** Downloads and stores compressed binary BSON metadata files locally from `libphonenumber-geo-carrier`. Phone parses, geocodes, and carrier-matches entirely inside your browser or native mobile webview—**no phone numbers are ever sent to a remote server.**
* **Prefix Triangulation Map:** Triangulates the geographic center coordinates of the registered country calling code and renders the area using an interactive **Leaflet Map**.
* **Privacy Controls:** Includes a military-grade **Privacy Mode** (Redaction Toggle) that obscures/reducts latitude and longitude coordinates and requires a manual "REVEAL" action to show.
* **Recent Searches Cache:** Remembers recent queries in a secure local cache with an absolute one-click clean/remove capability.

### 2. 🤝 Pair Tracking (Peer-to-Peer Uplink)
For active real-time tracking, MobTracker utilizes a zero-server, serverless, opt-in volunteer-pairing protocol.
* **Serverless HTTP Relay:** Leverages the free public HTTP push/subscription service [`ntfy.sh`](https://ntfy.sh/) as a highly efficient real-time message exchange bridge. No login, no database, and no server configuration required.
* **One-Time Cryptographic Pairing:** Instantly generates a unique, randomized sharing ID with an integrated, locally generated QR Code and pre-formatted invitation templates.
* **Multi-Channel Share Integrations:** One-click shortcuts to broadcast the tracking invitation link through **WhatsApp**, **Telegram**, **SMS**, or native Web Share API interfaces.
* **Receiver opt-in workflow:** Clicking the link prompts the receiver to grant standard HTML5 Geolocation permission. Once allowed, the receiver's device uses `navigator.geolocation.watchPosition` to broadcast high-accuracy location updates securely to the dedicated topic.
* **Intelligent Live Geofencing:** Define custom safe zone boundaries (radii in meters) from the initial connection. Trigger instant visible alarms and **HTML5 Desktop Notifications** if the paired device exits the designated geofence.
* **Saved Persistent Pairs:** Save pairing configurations inside local storage under custom aliases for fast re-pairing on persistent monitoring sessions.
* **Historical Route Mapping & CSV Export:** Track, log, and view past movements on a multi-point Leaflet line path. Export captured session paths directly to standardized CSV files for external analytical plotting.

---

## 🛠️ Technical Architecture & Stack

MobTracker utilizes a modern, optimized tech stack built for cross-platform compliance:

```
+-------------------------------------------------------------+
|                     React 19 SPA (Vite)                     |
+-------------------------------------------------------------+
|  Vite Plugins |  Tailwind CSS  | Leaflet Map |  BSON Assets |
+-------------------------------+-------------+---------------+
                                |
             +------------------+------------------+
             |                                     |
+------------v------------+           +------------v------------+
|    Capacitor iOS App    |           |  Capacitor Android App  |
|  (App.xcworkspace)      |           |  (Gradle, SDK 34)       |
+-------------------------+           +-------------------------+
```

* **Frontend Framework:** `React 19` and `TypeScript` compiled via `Vite` for lightning-fast bundling.
* **Styles & UI:** `Tailwind CSS 4` and `Lucide React` offering a highly custom "Terminal Dark" or "Blueprint Light" theme toggle.
* **Native Runtime:** `@capacitor/core` / `@capacitor/cli` v8 enabling direct bridge access to native mobile hardware APIs, permissions, and app wrapping.
* **Offline Deserialization:** BSON resource files inside `public/resources/` mapped using `libphonenumber-geo-carrier` and parsed with `google-libphonenumber`.
* **Maps engine:** Leaflet mapped with React bindings (`react-leaflet`) for robust, smooth visual rendering.

---

## 💻 Local Development Setup

To configure, compile, and run MobTracker locally on your machine, follow these instructions:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher, v22 recommended) and `npm` installed.

### 1. Clone the Repository
```bash
git clone https://github.com/gents83/MobTracker.git
cd MobTracker
```

### 2. Install Project Dependencies
Use `npm` to install packages with peer-dependency flags if needed:
```bash
npm install --legacy-peer-deps
```

### 3. Fetch Offline BSON Databases
The locator requires phone carrier and geocoding asset database chunks. Copy the assets into your public asset folder:
```bash
npm run prepare-resources
```
*(This automatically copies phone-prefix maps from `node_modules/libphonenumber-geo-carrier` to `public/resources`.)*

### 4. Run the Dev Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Unit Tests & Linter
Run standard checks to maintain codebase health:
```bash
# Run unit tests
npm run test

# Run TypeScript compilation checks
npm run lint
```

---

## 📦 Building and Deploying Platforms

MobTracker is prepared for instant compilation across multiple deployment targets.

### 🌐 Building for Web / GitHub Pages
To compile a minimized production build optimized for web servers:
```bash
npm run build
```
#### GitHub Pages Specifics
GitHub Pages hosts repositories in subpaths (e.g., `/MobTracker/`). Vite requires a conditional base path to satisfy both subpaths and local roots. By running the build with the `GITHUB_PAGES=true` environment variable, the compilation switches bases cleanly:
```bash
GITHUB_PAGES=true npm run build
```
The compiled SPA is exported into the `dist/` directory.

### 📱 Synchronizing Native Capacitor Apps
To sync your latest React production assets directly into native Android and iOS wrappers:
1. Ensure you have built the standard mobile assets:
   ```bash
   npm run build
   ```
2. Synchronize assets and plugins:
   ```bash
   npx cap sync
   ```

#### Android Platform Command Suite
Open, debug, or compile your signed native Android package:
```bash
# Open project in Android Studio
npx cap open android

# Compile a debug Android package (APK)
cd android
./gradlew assembleDebug
```
For release builds and secure signing guidelines, please consult the detailed [SIGNING.md](SIGNING.md) handbook.

#### iOS Platform Command Suite
Open and configure your native iOS build:
```bash
# Open project in Xcode (macOS Required)
npx cap open ios
```
Within Xcode, select your bundle ID, sign with your developer team account, and execute your build/test runs on simulated or physically connected iOS devices.

---

## 🤖 CI/CD Automation Pipeline

The repository includes a complete GitHub Actions automation pipeline configured in `.github/workflows/build-and-deploy.yml`.

The pipeline has been rebuilt from scratch to offer complete multi-platform compliance and reliable releases. On every push to the `main` or `master` branch, the workflow triggers the following jobs automatically:
1. **Quality Gate:** Run TypeScript static linting checks (`tsc --noEmit`) and automated Vitest unit tests to guarantee workspace correctness.
2. **Capacitor Assets Sync:** Generates production web assets and runs `npx cap sync` to synchronize the native wraps.
3. **GitHub Pages Deployment:** Compiles production web assets twice—first with the Pages subpath configured from the configure-pages output (using `GITHUB_PAGES=true` to target `/MobTracker/`) and deploys them live, then secondly with a standard root base path (`/`) to avoid mobile packaging conflicts.
4. **Android Build & Sign:** Sets up JDK 21 and Android SDK, builds a signed release package (**APK** and **AAB**), and utilizes the built-in release keys with standard or repository secrets.
5. **iOS Project Packaging:** Archives the entire pre-configured iOS workspace folder structure (`ios/App`) into a compressed `.zip` artifact (`mobtracker-ios-project.zip`).
6. **Automatic GitHub Releases:** Dynamically extracts the application version from `package.json`, registers a new draft-free tag, and attaches all compiled release binaries (**APK**, **AAB**, and **iOS Xcode project ZIP**) directly as downloadable release assets.

*Note: All links and relative markdown paths inside this README have been thoroughly verified and updated to ensure flawless resolution.*

---

## ⚖️ Legal Disclaimer

*MobTracker is designed as a secure location utility and prefix mapping educational interface. Pair tracking relies strictly on standard web sandboxes, user permissions, and user action. Unsanctioned and unauthorized pinpoint tracking of non-consenting users is not supported, technically impossible via public APIs, and violates global telecommunications privacy laws.*
