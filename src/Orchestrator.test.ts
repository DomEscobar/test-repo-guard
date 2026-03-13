import { Orchestrator } from './Orchestrator.js';
import { IAnalyzer, Report } from './types.js';

describe('Orchestrator', () => {
  const mockAnalyzer = (name: string, issues: any[] = []): IAnalyzer => ({
    name,
    analyze: async () => ({
      analyzerName: name,
      success: true,
      issues
    })
  });

  it('should run multiple analyzers in parallel and aggregate results', async () => {
    const a1 = mockAnalyzer('A1', [{ severity: 'error', type: 't1', message: 'm1' }]);
    const a2 = mockAnalyzer('A2', [{ severity: 'warning', type: 't2', message: 'm2' }]);
    
    const orchestrator = new Orchestrator([a1, a2]);
    const result = await orchestrator.run('dummy-diff');
    
    expect(result.totalIssues).toBe(2);
    expect(result.summary.errors).toBe(1);
    expect(result.summary.warnings).toBe(1);
    expect(result.reports).toHaveLength(2);
  });

  it('should handle analyzer failures gracefully', async () => {
    const failingAnalyzer: IAnalyzer = {
      name: 'Failer',
      analyze: async () => { throw new Error('Boom'); }
    };
    
    const orchestrator = new Orchestrator([failingAnalyzer]);
    const result = await orchestrator.run('dummy-diff');
    
    expect(result.totalIssues).toBe(1);
    expect(result.summary.errors).toBe(1);
    expect(result.reports[0].success).toBe(false);
    expect(result.reports[0].issues[0].message).toContain('Boom');
  });
});
