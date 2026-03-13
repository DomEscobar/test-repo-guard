import * as core from '@actions/core';
import { Orchestrator } from './Orchestrator.js';
import { GitHubReporter } from './GitHubReporter.js';
import { MockAIAnalyzer } from './analyzers/MockAIAnalyzer.js';
import { MockSecretsAnalyzer } from './analyzers/MockSecretsAnalyzer.js';
import { AutoFixHandler } from './AutoFixHandler.js';

/**
 * Main entrypoint for the Repo Guard GitHub Action.
 */
async function run(): Promise<void> {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME;
    const token = process.env.GITHUB_TOKEN || core.getInput('github-token');

    if (!token) {
      throw new Error('GITHUB_TOKEN is not set.');
    }

    console.log(`Event Name: ${eventName}`);

    if (eventName === 'pull_request') {
      console.log('Starting Analysis Flow...');
      
      const orchestrator = new Orchestrator([
        new MockAIAnalyzer(),
        new MockSecretsAnalyzer()
      ]);

      // In a real scenario, we would fetch the actual diff here.
      const dummyDiff = 'diff --git a/src/index.ts b/src/index.ts...';
      const aggregatedReport = await orchestrator.run(dummyDiff);

      const reporter = new GitHubReporter(token);
      await reporter.report(aggregatedReport);
      
      console.log('Analysis Flow Complete.');
    } else if (eventName === 'issue_comment') {
      console.log('Starting Auto-Fix Flow...');
      
      const handler = new AutoFixHandler(token);
      await handler.handle();
      
      console.log('Auto-Fix Flow Complete.');
    } else {
      console.log(`Event ${eventName} is not supported. Skipping.`);
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
  }
}

run();
