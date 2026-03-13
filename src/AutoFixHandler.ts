import * as github from '@actions/github';
import { execSync } from 'child_process';

/**
 * AutoFixHandler handles '@opencode fix' commands from PR comments.
 */
export class AutoFixHandler {
  private octokit;

  /**
   * @param token GitHub token (e.g., secrets.GITHUB_TOKEN)
   */
  constructor(token: string) {
    this.octokit = github.getOctokit(token);
  }

  /**
   * Main entry point for handling the issue_comment event.
   */
  async handle(): Promise<void> {
    const { payload, eventName } = github.context;

    // Verify event and comment content
    if (eventName !== 'issue_comment' || !payload.comment || !payload.issue?.pull_request) {
      console.log('Not a PR comment event, skipping.');
      return;
    }

    const commentBody: string = payload.comment.body;
    if (!commentBody.includes('@opencode fix')) {
      console.log('No @opencode fix command found, skipping.');
      return;
    }

    console.log('Auto-fix command detected. Initializing...');

    try {
      const { owner, repo } = github.context.repo;
      const pullNumber = payload.issue.number;

      // Fetch PR details to identify the head branch
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const branch = pr.head.ref;
      console.log(`Target branch: ${branch}`);

      // Execute Git operations
      this.executeGitFlow(branch);

      console.log('Auto-fix successfully pushed to origin.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Auto-fix failed: ${message}`);
      throw error;
    }
  }

  /**
   * Executes the Git command sequence to apply changes and push.
   */
  private executeGitFlow(branch: string): void {
    const commands = [
      'git config user.name "opencode-bot"',
      'git config user.email "bot@opencode.com"',
      `git fetch origin ${branch}`,
      `git checkout ${branch}`,
      // Dummy modification as requested
      `echo // Auto-fix applied: ${new Date().toISOString()} >> src/fix-log.txt`,
      'git add .',
      'git commit -m "chore: apply opencode auto-fix"',
      `git push origin ${branch}`
    ];

    for (const cmd of commands) {
      console.log(`Running: ${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
    }
  }
}
