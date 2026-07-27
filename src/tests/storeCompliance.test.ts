import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('App store compliance and multi-platform validation tests', () => {

  // 1. App Icon and Splash Assets Verification
  describe('Assets Compliance', () => {
    it('verifies that the source icon assets exist in the root assets folder', () => {
      const logoPath = path.resolve(__dirname, '../../assets/logo.png');
      const iconPath = path.resolve(__dirname, '../../assets/icon.png');
      expect(fs.existsSync(logoPath)).toBe(true);
      expect(fs.existsSync(iconPath)).toBe(true);
    });

    it('verifies that Android launcher and adaptive icons are generated', () => {
      const resPath = path.resolve(__dirname, '../../android/app/src/main/res');

      const mipmapHdpiIcon = path.join(resPath, 'mipmap-hdpi/ic_launcher.png');
      const mipmapXxxhdpiIcon = path.join(resPath, 'mipmap-xxxhdpi/ic_launcher.png');
      const mipmapHdpiForeground = path.join(resPath, 'mipmap-hdpi/ic_launcher_foreground.png');

      expect(fs.existsSync(mipmapHdpiIcon)).toBe(true);
      expect(fs.existsSync(mipmapXxxhdpiIcon)).toBe(true);
      expect(fs.existsSync(mipmapHdpiForeground)).toBe(true);
    });

    it('verifies that iOS AppIcon is generated and set up correctly', () => {
      const iosAssetsPath = path.resolve(__dirname, '../../ios/App/App/Assets.xcassets');
      const appIconPath = path.join(iosAssetsPath, 'AppIcon.appiconset/AppIcon-512@2x.png');

      expect(fs.existsSync(appIconPath)).toBe(true);
    });
  });

  // 2. Capacitor Configuration Compliance
  describe('Capacitor Configuration Compliance', () => {
    it('verifies capacitor.config.ts contains compliant properties for store submission', async () => {
      const configPath = path.resolve(__dirname, '../../capacitor.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf8');

      // Ensure reverse domain appId structure
      expect(content).toContain("appId: 'com.mobtrack.app'");

      // Ensure correct app name
      expect(content).toContain("appName: 'MobTracker'");

      // Ensure explicit secure context config using HTTPS android scheme
      expect(content).toContain("androidScheme: 'https'");
    });
  });

  // 3. Android Manifest & Package Structure Compliance
  describe('Android Platform Compliance', () => {
    const manifestPath = path.resolve(__dirname, '../../android/app/src/main/AndroidManifest.xml');

    it('verifies AndroidManifest.xml exists and has standard package icons', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, 'utf8');

      // Android Icon reference
      expect(content).toContain('android:icon="@mipmap/ic_launcher"');
      // Android Round Icon reference
      expect(content).toContain('android:roundIcon="@mipmap/ic_launcher_round"');
    });

    it('verifies requested permissions are compliant and safe', () => {
      const content = fs.readFileSync(manifestPath, 'utf8');

      // Basic needed permissions
      expect(content).toContain('android.permission.INTERNET');
      expect(content).toContain('android.permission.ACCESS_FINE_LOCATION');

      // Verify no overly-privileged / blacklisted store permissions are present
      expect(content).not.toContain('android.permission.READ_SMS');
      expect(content).not.toContain('android.permission.RECEIVE_SMS');
      expect(content).not.toContain('android.permission.PROCESS_OUTGOING_CALLS');
    });

    it('verifies MainActivity.java package path structure matches appId', () => {
      const mainActivityPath = path.resolve(__dirname, '../../android/app/src/main/java/com/mobtrack/app/MainActivity.java');
      expect(fs.existsSync(mainActivityPath)).toBe(true);

      const content = fs.readFileSync(mainActivityPath, 'utf8');
      expect(content).toContain('package com.mobtrack.app;');
    });
  });

  // 4. Web Engine / Vite WebView Compatibility Compliance
  describe('Vite WebView Compatibility', () => {
    it('verifies that vite.config.ts uses target es2020 for wide Android WebView compatibility', () => {
      const configPath = path.resolve(__dirname, '../../vite.config.ts');
      const content = fs.readFileSync(configPath, 'utf8');

      expect(content).toContain("target: 'es2020'");
    });
  });

  // 5. Google Play Store Privacy Policy Compliance
  describe('Privacy Policy Compliance', () => {
    it('verifies that public/privacy.html exists and is non-empty', () => {
      const privacyPath = path.resolve(__dirname, '../../public/privacy.html');
      expect(fs.existsSync(privacyPath)).toBe(true);

      const content = fs.readFileSync(privacyPath, 'utf8');
      expect(content.length).toBeGreaterThan(500);
    });

    it('verifies that the privacy policy includes mandatory disclosures for Google Play Store submission', () => {
      const privacyPath = path.resolve(__dirname, '../../public/privacy.html');
      const content = fs.readFileSync(privacyPath, 'utf8');

      // Check for core identity and key compliance declarations
      expect(content).toContain('MobTracker');
      expect(content.toLowerCase()).toContain('privacy policy');
      expect(content).toContain('Location Data');
      expect(content).toContain('ntfy.sh');
      expect(content).toContain('localStorage');
      expect(content).toContain('Google Play Compliance');
    });

    it('verifies that the Privacy Policy is integrated and accessible inside the application logic', () => {
      const appPath = path.resolve(__dirname, '../../src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf8');

      // Ensure footer or modal mechanism to toggle privacy overlay is defined
      expect(content).toContain('showPrivacyModal');
      expect(content).toContain('Privacy Policy');
    });
  });
});
