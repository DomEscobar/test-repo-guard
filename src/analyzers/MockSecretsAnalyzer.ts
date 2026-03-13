import { IAnalyzer, Report } from '../types.js';

/**
 * MockSecretsAnalyzer simulates a security scanner that detects exposed secrets.
 * It returns a static error finding.
 */
export class MockSecretsAnalyzer implements IAnalyzer {
  readonly name = 'MockSecretsAnalyzer';

  /**
   * Analyzes the provided diff and returns a mock report.
   * @param diff - The git diff string to analyze (ignored in this mock).
   * @returns A promise resolving to a Report object.
   */
  async analyze(diff: string): Promise<Report> {
    return {
      analyzerName: this.name,
      success: true,
      issues: [
        {
          type: 'SECRET_EXPOSURE',
          message: 'Potential API key found in code.',
          severity: 'error',
        },
      ],
    };
  }
}
