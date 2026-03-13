import { IAnalyzer, Report, Issue } from '../types.js';

/**
 * AIAnalyzer leverages an LLM to review code changes.
 * Requires a provider API key in environment variables.
 */
export class AIAnalyzer implements IAnalyzer {
  readonly name = 'AIAnalyzer';

  /**
   * Sends the diff to an AI provider for review.
   */
  async analyze(diff: string): Promise<Report> {
    const apiKey = process.env.AI_API_KEY;
    const apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
    const model = process.env.AI_MODEL || 'gpt-4o';

    if (!apiKey) {
      return {
        analyzerName: this.name,
        success: false,
        issues: [{
          type: 'CONFIGURATION_ERROR',
          message: 'AI_API_KEY environment variable is not set. AI review skipped.',
          severity: 'warning'
        }]
      };
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer. Analyze the following git diff and provide constructive feedback. Return the result as a JSON array of objects with "message" and "severity" (info, warning, error) fields. Focus on logic, security, and performance.'
            },
            {
              role: 'user',
              content: diff
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status ${response.status}`);
      }

      const data: any = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      
      const rawIssues = content.issues || content.suggestions || [];
      const issues: Issue[] = rawIssues.map((issue: any) => ({
        type: 'AI_SUGGESTION',
        message: issue.message,
        severity: issue.severity || 'info',
      }));

      return {
        analyzerName: this.name,
        success: true,
        issues,
      };
    } catch (error) {
      return {
        analyzerName: this.name,
        success: false,
        issues: [{
          type: 'AI_RUNTIME_ERROR',
          message: `Failed to get AI review: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      };
    }
  }
}
