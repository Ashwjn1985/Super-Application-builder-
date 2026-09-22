# Super Video — JEV AI × GPT-6 Astra Workbench

A local-first application generator that coordinates two OpenAI-compatible API providers through a small multi-agent workflow:

1. **Architect** — decomposes the request into an implementation plan.
2. **Builder** — proposes the app structure and implementation.
3. **Critic** — checks security, feasibility, and missing requirements.
4. **Synthesizer** — combines the results into a polished deliverable.

The UI never sends API keys directly to a third-party API. The Node server keeps keys in memory and proxies requests from the browser.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000.

## Provider setup

In the UI, enter each provider's OpenAI-compatible Base URL, API key, and model ID. JEV AI and GPT-6 Astra can use different endpoints. The default paths are `/models` and `/responses`; switch to Chat Completions if a provider does not support Responses.

Environment variables may also be used:

```bash
JEV_BASE_URL=https://your-jev-gateway.example/v1
JEV_API_KEY=replace-me
JEV_MODEL=jev-model
ASTRA_BASE_URL=https://your-astra-gateway.example/v1
ASTRA_API_KEY=replace-me
ASTRA_MODEL=gpt-6-astra
PORT=3000
```

Never commit real keys. The previous `Astra` file contained a credential-shaped value; rotate it at the issuing service and keep credentials in environment variables or the local UI session only.
