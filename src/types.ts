/**
 * Represents an individual issue found during analysis.
 */
export interface Issue {
  type: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'info' | 'warning' | 'error';
}

/**
 * The result of a single analyzer's execution.
 */
export interface Report {
  analyzerName: string;
  success: boolean;
  issues: Issue[];
  executionTime?: number; // Optional: time taken in milliseconds
}

/**
 * Interface for all analysis modules.
 */
export interface IAnalyzer {
  readonly name: string;
  analyze(diff: string): Promise<Report>;
}

/**
 * The combined result of all analyzers executed by the Orchestrator.
 */
export interface AggregatedReport {
  totalIssues: number;
  reports: Report[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}
