/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { encryptPairId, decryptPairId } from '../utils/crypto';

describe('Symmetric URL Parameter Obfuscation (Option C)', () => {
  it('should successfully encrypt and decrypt a random pairing ID', () => {
    const originalId = 'abc-123-xyz-987';
    const encrypted = encryptPairId(originalId);

    expect(encrypted).not.toBe(originalId);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = decryptPairId(encrypted);
    expect(decrypted).toBe(originalId);
  });

  it('should generate URL-safe output with no unsafe characters', () => {
    const id = 'abc+123/xyz=987?special!';
    const encrypted = encryptPairId(id);

    // URL-safe output must not contain +, /, or =
    expect(encrypted).not.toContain('+');
    expect(encrypted).not.toContain('/');
    expect(encrypted).not.toContain('=');

    const decrypted = decryptPairId(encrypted);
    expect(decrypted).toBe(id);
  });

  it('should handle empty or null-like strings gracefully', () => {
    expect(encryptPairId('')).toBe('');
    expect(decryptPairId('')).toBe('');
  });

  it('should be deterministic', () => {
    const id = 'test-deterministic-id-1';
    const enc1 = encryptPairId(id);
    const enc2 = encryptPairId(id);

    expect(enc1).toBe(enc2);
  });
});
