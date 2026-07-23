import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('CI/CD Workflow Configuration Verification', () => {
  const workflowPath = path.resolve(__dirname, '../../.github/workflows/build-and-deploy.yml');

  it('verifies that the build-and-deploy.yml file exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('ensures no continue-on-error is used to mask failures in deployment/release steps', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    // We want to make sure continue-on-error is not used to silently swallow errors
    const hasContinueOnError = content.includes('continue-on-error');
    expect(hasContinueOnError).toBe(false);
  });

  it('verifies that the workflow triggers only on push events and not pull_request', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Ensure pull_request trigger is removed to prevent skipped steps/jobs or partial failures
    expect(content).toContain('on:\n  push:');
    expect(content).not.toContain('pull_request:');
  });

  it('ensures no if condition check is used to skip release or deployment steps', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Make sure we do not use 'if: github.event_name == 'push'' which would cause steps to be skipped on triggers
    expect(content).not.toContain("if: github.event_name == 'push'");
  });

  it('verifies that the deploy-pages job uses a clean, unconditional environment name to avoid complex state checks', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    const environmentIndex = content.indexOf('environment:');
    expect(environmentIndex).toBeGreaterThan(-1);
    const environmentBlock = content.slice(environmentIndex, environmentIndex + 300);

    expect(environmentBlock).toContain("name: github-pages");
    expect(environmentBlock).toContain("url: ${{ steps.deployment.outputs.page_url }}");
  });
});
