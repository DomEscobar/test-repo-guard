import { IAnalyzer, Report, Issue } from '../types.js';

/**
 * SecretsAnalyzer scans the diff for common sensitive information.
 */
export class SecretsAnalyzer implements IAnalyzer {
  readonly name = 'SecretsAnalyzer';

  private readonly patterns = [
    { name: 'AWS Access Key', regex: /([^A-Z0-9])[A-Z0-9]{20}([^A-Z0-9])/g },
    { name: 'AWS Secret Key', regex: /([^a-zA-Z0-9/+=])[a-zA-Z0-9/+=]{40}([^a-zA-Z0-9/+=])/g },
    { name: 'GitHub Token', regex: /gh[oprsu]_[a-zA-Z0-9]{36,251}/g },
    { name: 'Stripe API Key', regex: /sk_live_[0-9a-zA-Z]{24}/g },
    { name: 'Slack Webhook', regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{8}\/B[0-9A-Z]{8}\/[0-9a-zA-Z]{24}/g },
    { name: 'Generic Private Key', regex: /-----BEGIN (RSA|EC|DSA|GPG|OPENSSH) PRIVATE KEY-----/g },
  ];

  /**
   * Scans the diff for secrets.
   */
  async analyze(diff: string): Promise<Report> {
    const issues: Issue[] = [];
    const lines = diff.split('\n');

    let currentFile = '';
    let currentLineNumber = 0;

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFile = line.substring(6);
        continue;
      }

      if (line.startsWith('@@')) {
        const match = line.match(/\+([0-9]+)/);
        if (match) {
          currentLineNumber = parseInt(match[1], 10) - 1;
        }
        continue;
      }

      if (line.startsWith('+')) {
        currentLineNumber++;
        const content = line.substring(1);

        for (const pattern of this.patterns) {
          if (pattern.regex.test(content)) {
            issues.push({
              type: 'SECRET_EXPOSURE',
              message: `Potential ${pattern.name} found.`,
              file: currentFile,
              line: currentLineNumber,
              severity: 'error',
            });
          }
          // Reset regex state for global flags
          pattern.regex.lastIndex = 0;
        }
      } else if (!line.startsWith('-')) {
        currentLineNumber++;
      }
    }

    return {
      analyzerName: this.name,
      success: true,
      issues,
    };
  }
}
