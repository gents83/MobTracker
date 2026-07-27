import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Digital Asset Links (assetlinks.json) Compliance Tests', () => {
  const assetlinksPath = path.resolve(__dirname, '../../public/.well-known/assetlinks.json');

  it('should exist inside public/.well-known/ folder', () => {
    expect(fs.existsSync(assetlinksPath)).toBe(true);
  });

  it('should be valid JSON and correctly parse as an array of statements', () => {
    const rawContent = fs.readFileSync(assetlinksPath, 'utf8');
    let parsed: any;
    expect(() => {
      parsed = JSON.parse(rawContent);
    }).not.toThrow();

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should contain the delegate_permission relation and target package com.mobtrack.app', () => {
    const rawContent = fs.readFileSync(assetlinksPath, 'utf8');
    const parsed = JSON.parse(rawContent);

    const statement = parsed.find(
      (s: any) => s.target && s.target.package_name === 'com.mobtrack.app'
    );

    expect(statement).toBeDefined();
    expect(statement.relation).toContain('delegate_permission/common.handle_all_urls');
    expect(statement.target.namespace).toBe('android_app');
  });

  it('should contain all three SHA-256 fingerprints for Quantum-Ready Hybrid Signing', () => {
    const rawContent = fs.readFileSync(assetlinksPath, 'utf8');
    const parsed = JSON.parse(rawContent);

    const statement = parsed.find(
      (s: any) => s.target && s.target.package_name === 'com.mobtrack.app'
    );

    const fingerprints = statement.target.sha256_cert_fingerprints;
    expect(fingerprints).toBeDefined();

    // Deployment certificate (classical pre-Android 17)
    expect(fingerprints).toContain(
      '07:5C:FE:85:CE:4B:DD:25:6C:F4:A5:5C:11:18:3A:3E:0E:8A:85:17:3E:2B:B3:65:72:56:77:4D:8A:3C:93:3D'
    );

    // Hybrid Classical certificate (Android 17+)
    expect(fingerprints).toContain(
      'B8:0C:70:9C:EA:88:DA:8F:CC:39:24:0E:EA:DB:5F:88:9A:AD:6D:1C:A4:20:75:01:55:D2:46:B0:D6:6A:EA:03'
    );

    // Hybrid Post-Quantum certificate (Android 17+ PQC)
    expect(fingerprints).toContain(
      '5E:50:BC:D1:FC:39:3D:59:67:84:5C:01:96:1E:44:66:4B:46:F9:FC:37:33:DF:43:59:09:46:9F:86:A5:40:2F'
    );
  });
});
