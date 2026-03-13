import * as github from '@actions/github';
import { AggregatedReport } from './types.js';

/**
 * GitHubReporter handles reporting analysis results back to GitHub as PR comments.
 */
export class GitHubReporter {
  private octokit;

  /**
   * @param token GitHub token for authentication (e.g., GITHUB_TOKEN)
   */
  constructor(token: string) {
    this.octokit = github.getOctokit(token);
  }

  /**
   * Reports the aggregated analysis results to the GitHub Pull Request.
   * It searches for an existing comment containing the '<!-- opencode-guard -->' identifier.
   * If found, it updates that comment; otherwise, it creates a new one.
   * 
   * @param report The aggregated report from all analyzers.
   */
  async report(report: AggregatedReport): Promise<void> {
    const context = github.context;
    const { owner, repo } = context.repo;
    
    // Ensure we are in a Pull Request context
    const pullRequestNumber = context.payload.pull_request?.number;

    if (!pullRequestNumber) {
      console.warn('GitHubReporter: No pull request number found in context. Skipping report.');
      return;
    }

    const identifier = '<!-- opencode-guard -->';
    const body = this.generateMarkdown(report, identifier);

    try {
      const existingComment = await this.findComment(owner, repo, pullRequestNumber, identifier);

      if (existingComment) {
        await this.octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: existingComment.id,
          body,
        });
      } else {
        await this.octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pullRequestNumber,
          body,
        });
      }
    } catch (error) {
      console.error('GitHubReporter: Failed to post/update comment:', error);
      throw error;
    }
  }

  /**
   * Finds an existing comment on the PR that contains the specified identifier.
   */
  private async findComment(owner: string, repo: string, issueNumber: number, identifier: string) {
    const comments = await this.octokit.paginate(this.octokit.rest.issues.listComments, {
      owner,
      repo,
      issue_number: issueNumber,
    });

    return comments.find(c => c.body?.includes(identifier));
  }

  /**
   * Generates a Markdown representation of the aggregated report.
   */
  private generateMarkdown(report: AggregatedReport, identifier: string): string {
    const lines: string[] = [];
    lines.push('## 🛡️ Repo Guard Analysis');
    lines.push('');
    
    // Summary Table
    lines.push('| Analyzer | Status | Errors | Warnings | Infos |');
    lines.push('| :--- | :---: | :---: | :---: | :---: |');

    for (const r of report.reports) {
      const counts = {
        error: r.issues.filter(i => i.severity === 'error').length,
        warning: r.issues.filter(i => i.severity === 'warning').length,
        info: r.issues.filter(i => i.severity === 'info').length,
      };
      const status = r.success ? '✅' : '❌';
      lines.push(`| ${r.analyzerName} | ${status} | ${counts.error} | ${counts.warning} | ${counts.info} |`);
    }

    lines.push('');
    lines.push(`**Total Issues:** ${report.totalIssues} (${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.infos} infos)`);

    // Detailed Issues (Collapsible)
    if (report.totalIssues > 0) {
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>View Detailed Issues</summary>');
      lines.push('');
      lines.push('| File | Line | Severity | Message |');
      lines.push('| :--- | :--- | :--- | :--- |');

      for (const r of report.reports) {
        for (const issue of r.issues) {
          const file = issue.file ? `\`${issue.file}\`` : '-';
          const line = issue.line || '-';
          const severity = issue.severity.toUpperCase();
          lines.push(`| ${file} | ${line} | ${severity} | ${issue.message} |`);
        }
      }

      lines.push('');
      lines.push('</details>');
    }

    lines.push('');
    lines.push(identifier);

    return lines.join('\n');
  }
}
