# Super Agents Application Generator

A local-first application generator using two OpenAI-compatible providers: **GPT-6 Astra** and **JEV AI**.

It helps turn an application idea into a practical delivery plan through four stages:

1. **Architect** — decomposes the request into requirements, user journeys, and technical architecture.
2. **Builder** — proposes the application structure, data model, APIs, UI, and implementation approach.
3. **Critic** — checks security, feasibility, accessibility, risks, and missing requirements.
4. **Synthesizer** — combines the work into one implementation-ready result.

## Run

```bash
npm install
npm test
npm start
```

Open http://localhost:3000. Node.js 18+ is required.

## Provider configuration

The UI supports GPT-6 Astra and JEV AI provider cards. Each provider can be configured with:

- HTTPS-compatible base URL
- API key
- Model ID
- Responses API or Chat Completions wire format

Environment variables can also be supplied by the host process. Copy `.env.example` to your deployment configuration; Node does not automatically load `.env` files.

```bash
ASTRA_BASE_URL=https://your-astra-gateway.example/v1
ASTRA_API_KEY=replace-me
ASTRA_MODEL=gpt-6-astra
ASTRA_WIRE_API=responses
JEV_BASE_URL=https://your-jev-gateway.example/v1
JEV_API_KEY=replace-me
JEV_MODEL=jev-model
JEV_WIRE_API=responses
```

The browser does not persist API keys. Never commit real keys, and rotate any credential that has appeared in a commit or log.

## Scope

The generator is intended to assist with application discovery and delivery planning for Android, web, and other platforms. Include the target users, workflows, offline requirements, attachments, roles, accessibility, privacy, integrations, and testing expectations in the mission brief so the agents can address them.
