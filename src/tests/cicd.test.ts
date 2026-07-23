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

  it('verifies that the workflow triggers on both push and pull_request events', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Ensure both push and pull_request triggers are present
    expect(content).toContain('push:');
    expect(content).toContain('pull_request:');
  });

  it('ensures release or deployment steps/jobs are conditional and run only on push', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Make sure we use 'if: github.event_name == 'push'' to protect release and deployment steps/jobs
    expect(content).toContain("if: github.event_name == 'push'");
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
