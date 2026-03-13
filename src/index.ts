import * as core from '@actions/core';
import * as github from '@actions/github';
import { Orchestrator } from './Orchestrator.js';
import { GitHubReporter } from './GitHubReporter.js';
import { AIAnalyzer } from './analyzers/AIAnalyzer.js';
import { SecretsAnalyzer } from './analyzers/SecretsAnalyzer.js';
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

    const octokit = github.getOctokit(token);
    console.log(`Event Name: ${eventName}`);

    if (eventName === 'pull_request') {
      console.log('Starting Analysis Flow...');
      
      const { owner, repo } = github.context.repo;
      const pullNumber = github.context.payload.pull_request?.number;

      if (!pullNumber) {
        throw new Error('Pull request number not found in context.');
      }

      // Fetch the actual diff from GitHub
      const { data: diff } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: {
          format: 'diff',
        },
      });

      const orchestrator = new Orchestrator([
        new AIAnalyzer(),
        new SecretsAnalyzer()
      ]);

      const aggregatedReport = await orchestrator.run(diff as unknown as string);

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
