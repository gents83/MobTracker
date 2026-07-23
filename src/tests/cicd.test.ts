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

  it('verifies release and pages steps/jobs are conditioned with if checks', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Find the Create GitHub Release step block
    const releaseIndex = content.indexOf('Create GitHub Release');
    expect(releaseIndex).toBeGreaterThan(-1);

    // Get the block of lines around it
    const releaseBlock = content.slice(releaseIndex, releaseIndex + 500);
    expect(releaseBlock).toContain("if: github.event_name == 'push'");

    // Find the Configure GitHub Pages step block
    const configPagesIndex = content.indexOf('Configure GitHub Pages');
    expect(configPagesIndex).toBeGreaterThan(-1);
    const configPagesBlock = content.slice(configPagesIndex, configPagesIndex + 500);
    expect(configPagesBlock).toContain("if: github.event_name == 'push'");

    // Find the Upload Pages Web Artifact step block
    const uploadPagesIndex = content.indexOf('Upload Pages Web Artifact');
    expect(uploadPagesIndex).toBeGreaterThan(-1);
    const uploadPagesBlock = content.slice(uploadPagesIndex, uploadPagesIndex + 500);
    expect(uploadPagesBlock).toContain("if: github.event_name == 'push'");

    // Find the Deploy to GitHub Pages step block
    const deployStepIndex = content.indexOf('Deploy to GitHub Pages');
    expect(deployStepIndex).toBeGreaterThan(-1);
    const deployStepBlock = content.slice(deployStepIndex, deployStepIndex + 500);
    expect(deployStepBlock).toContain("if: github.event_name == 'push'");
  });

  it('verifies that the deploy-pages job uses a conditional environment name to avoid restricted environments on PRs', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    const environmentIndex = content.indexOf('environment:');
    expect(environmentIndex).toBeGreaterThan(-1);
    const environmentBlock = content.slice(environmentIndex, environmentIndex + 300);

    expect(environmentBlock).toContain("name: ${{ github.event_name == 'push' && 'github-pages' || '' }}");
    expect(environmentBlock).toContain("url: ${{ github.event_name == 'push' && steps.deployment.outputs.page_url || '' }}");
  });
});
