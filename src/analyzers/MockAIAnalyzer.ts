import { IAnalyzer, Report } from '../types.js';

/**
 * MockAIAnalyzer simulates an AI-powered code analysis tool.
 * It returns a static informational finding.
 */
export class MockAIAnalyzer implements IAnalyzer {
  readonly name = 'MockAIAnalyzer';

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
          type: 'AI_SUGGESTION',
          message: 'Consider refactoring this loop for better performance.',
          severity: 'info',
        },
      ],
    };
  }
}
