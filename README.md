# Repo Guard: CI-Native PR Protection

Repo Guard is a high-performance, modular GitHub Action designed to automatically protect pull requests through deep analysis and interactive auto-remediation. It leverages parallel execution to run multiple analyzers (AI, Security, SAST) simultaneously.

## 🚀 How It Works

Repo Guard operates on a dual-flow architecture based on GitHub webhook events:

### 1. The Analysis Flow (`pull_request`)
When a PR is opened or updated, Repo Guard triggers its **Orchestrator**.
*   **Real-time Diff Analysis**: It fetches the actual PR diff from the GitHub API using `@actions/github`.
*   **Parallel Execution**: It dispatches multiple analyzers concurrently:
    *   **AI Reviewer**: Uses LLMs (GPT-4o) to provide deep logic and security feedback.
    *   **Secrets Scanner**: Scans for 6+ types of exposed credentials (AWS, Stripe, GitHub Tokens, etc.) using high-precision regex.
*   **Intelligent Reporting**: The `GitHubReporter` aggregates all findings into a structured Markdown report.
*   **Comment Management**: Instead of spamming the PR with new comments, it searches for its own previous report (using a hidden signature `<!-- opencode-guard -->`) and updates it in place.

### 2. The Auto-Fix Flow (`issue_comment`)
Repo Guard acts as an interactive bot. If a developer comments `@opencode fix` on a PR:
*   **Branch Resolution**: It queries the GitHub API to find the exact `head` branch of the pull request.
*   **Automated Remediation**: It performs a secure Git checkout in the CI environment, applies necessary fixes (or demonstration patches), and pushes a `chore: apply opencode auto-fix` commit directly back to the PR branch.

## 🏗️ Architecture

```text
src/
├── index.ts           # Entrypoint: Fetches diff, routes events
├── Orchestrator.ts    # Logic for running parallel IAnalyzers
├── GitHubReporter.ts  # Markdown generator & GitHub API wrapper
├── AutoFixHandler.ts  # Git checkout/commit/push engine
├── types.ts           # Shared interfaces
└── analyzers/         # Modular analysis engines
    ├── AIAnalyzer.ts      # Real LLM-based code review
    └── SecretsAnalyzer.ts # Production-ready secret scanner
```

## 🛠️ Configuration
To use the AI Reviewer, set the following environment variable in your GitHub Workflow:
*   `AI_API_KEY`: Your OpenAI or compatible API key.

## ⚙️ CI Configuration
To deploy this as a GitHub Action, use a workflow like this:
```yaml
name: Repo Guard
on:
  pull_request:
    types: [opened, synchronize]
  issue_comment:
    types: [created]

jobs:
  guard:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install && npm run build
      - name: Run Repo Guard
        run: node dist/index.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
```


## 🛠️ Local Development & Testing

We include a robust **Local Simulation Harness** to test the Action logic without needing to push to a live repository.

### Prerequisites
*   Node.js 16+
*   `npm install`

### Run Simulations
The simulations use JSON payloads located in `mocks/` to trick the Action into thinking it is running inside a real GitHub CI environment.

```bash
# Compile the project
npm run build

# Simulate a Pull Request Analysis
node --loader ts-node/esm scripts/run-local.ts pr

# Simulate an @opencode fix comment
node --loader ts-node/esm scripts/run-local.ts fix
```

*Note: In local mode, the simulations will attempt to call the GitHub API and will fail with "Bad Credentials" unless a valid GITHUB_TOKEN is provided in the environment.*

## 🧪 Testing
The core logic is covered by Jest unit tests.
```bash
npm test
```

## ⚙️ CI Configuration
To deploy this as a GitHub Action, ensure your workflow has the following permissions:
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: read
```

<!-- Demo comment for testing PR workflow -->



<!-- Demo comment for testing PR workflow -->
