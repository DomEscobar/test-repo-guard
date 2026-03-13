import { IAnalyzer, Report, AggregatedReport } from './types.js';

export class Orchestrator {
  private analyzers: IAnalyzer[];

  /**
   * @param analyzers An array of analyzers to be executed.
   */
  constructor(analyzers: IAnalyzer[]) {
    this.analyzers = analyzers;
  }

  /**
   * Runs all registered analyzers against the provided diff in parallel.
   * 
   * @param diff The git diff string to analyze.
   * @returns A promise that resolves to an aggregated report.
   */
  async run(diff: string): Promise<AggregatedReport> {
    const reports = await Promise.all(
      this.analyzers.map(async (analyzer) => {
        const startTime = Date.now();
        try {
          const report = await analyzer.analyze(diff);
          return {
            ...report,
            executionTime: report.executionTime ?? (Date.now() - startTime),
          };
        } catch (error) {
          // Fail-safe: prevent one analyzer from crashing the entire run
          return {
            analyzerName: analyzer.name,
            success: false,
            issues: [{
              type: 'runtime-error',
              message: `Analyzer "${analyzer.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
              severity: 'error'
            }],
            executionTime: Date.now() - startTime
          } as Report;
        }
      })
    );

    return this.aggregate(reports);
  }

  /**
   * Aggregates individual reports into a single summary.
   */
  private aggregate(reports: Report[]): AggregatedReport {
    const summary = {
      errors: 0,
      warnings: 0,
      infos: 0,
    };

    let totalIssues = 0;

    for (const report of reports) {
      for (const issue of report.issues) {
        totalIssues++;
        if (issue.severity === 'error') summary.errors++;
        else if (issue.severity === 'warning') summary.warnings++;
        else if (issue.severity === 'info') summary.infos++;
      }
    }

    return {
      totalIssues,
      reports,
      summary,
    };
  }
}
