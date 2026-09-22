const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const root = path.join(__dirname, 'public');

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 2_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function cleanBase(value) { return String(value || '').trim().replace(/\/+$/, ''); }
function safeProvider(input = {}) {
  return {
    name: input.name === 'astra' ? 'astra' : 'jev',
    baseUrl: cleanBase(input.baseUrl),
    apiKey: String(input.apiKey || ''),
    model: String(input.model || '').trim(),
    wireApi: input.wireApi === 'chat' ? 'chat' : 'responses'
  };
}
function endpoint(provider, suffix) { return `${provider.baseUrl}/${suffix.replace(/^\/+/, '')}`; }
function extractText(payload) {
  if (!payload) return '';
  if (typeof payload.output_text === 'string') return payload.output_text;
  if (typeof payload.text === 'string') return payload.text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  const fromOutput = output.flatMap(item => Array.isArray(item.content) ? item.content : []).map(x => x.text || x.value || '').filter(Boolean).join('\n');
  if (fromOutput) return fromOutput;
  return payload.choices?.[0]?.message?.content || payload.choices?.[0]?.text || '';
}
async function callModel(provider, prompt, system) {
  if (!provider.baseUrl || !provider.apiKey || !provider.model) throw new Error(`${provider.name} provider is not configured`);
  const isChat = provider.wireApi === 'chat';
  const payload = isChat
    ? { model: provider.model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], temperature: 0.2 }
    : { model: provider.model, input: `${system}\n\nUSER TASK:\n${prompt}`, reasoning: { effort: 'high' } };
  const response = await fetch(endpoint(provider, isChat ? 'chat/completions' : 'responses'), {
    method: 'POST', headers: { authorization: `Bearer ${provider.apiKey}`, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(payload)
  });
  const raw = await response.text();
  let parsed; try { parsed = JSON.parse(raw); } catch { parsed = { text: raw }; }
  if (!response.ok) throw new Error(`${provider.name} returned HTTP ${response.status}: ${parsed.error?.message || parsed.message || raw.slice(0, 300)}`);
  return extractText(parsed) || JSON.stringify(parsed, null, 2);
}
async function orchestrate(input) {
  const task = String(input.task || '').trim();
  if (!task) throw new Error('Describe the application you want to generate.');
  const jev = safeProvider({ ...input.jev, name: 'jev' });
  const astra = safeProvider({ ...input.astra, name: 'astra' });
  const shared = 'You are one member of a coordinated application-generation team. Be concrete, honest about uncertainty, and never invent API capabilities. Prefer secure, maintainable, production-ready solutions.';
  const [architecture, implementation] = await Promise.all([
    callModel(jev, task, `${shared}\nYou are the ARCHITECT. Return: product goal, user flows, data model, API boundaries, risks, and an ordered build plan.`),
    callModel(astra, task, `${shared}\nYou are the BUILDER. Return a practical implementation proposal with file tree, key components, acceptance criteria, and starter code where useful.`)
  ]);
  const reviewPrompt = `Original task:\n${task}\n\nARCHITECTURE:\n${architecture}\n\nIMPLEMENTATION:\n${implementation}`;
  const [critique, synthesis] = await Promise.all([
    callModel(jev, reviewPrompt, `${shared}\nYou are the CRITIC. Find contradictions, security issues, missing requirements, and the fastest safe corrections. Keep it actionable.`),
    callModel(astra, reviewPrompt, `${shared}\nYou are the DELIVERY LEAD. Produce a concise first-pass solution draft that reconciles both inputs and clearly marks assumptions.`)
  ]);
  const final = await callModel(astra, `TASK:\n${task}\n\nARCHITECT:\n${architecture}\n\nBUILDER:\n${implementation}\n\nCRITIC:\n${critique}\n\nDRAFT:\n${synthesis}`, `${shared}\nYou are the FINAL SYNTHESIZER. Deliver the best unique result: summary, recommended architecture, implementation steps, file tree, code or pseudocode for the critical path, security notes, and a verification checklist. Do not claim files were written.`);
  return { architecture, implementation, critique, synthesis, final, agents: ['JEV Architect', 'GPT-6 Astra Builder', 'JEV Critic', 'GPT-6 Astra Delivery Lead', 'GPT-6 Astra Synthesizer'] };
}
function serve(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    body(req).then(input => orchestrate(input)).then(result => json(res, 200, { ok: true, result })).catch(error => json(res, 400, { ok: false, error: error.message }));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/config') {
    return json(res, 200, { jev: { baseUrl: process.env.JEV_BASE_URL || '', model: process.env.JEV_MODEL || '' }, astra: { baseUrl: process.env.ASTRA_BASE_URL || '', model: process.env.ASTRA_MODEL || 'gpt-6-astra' } });
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.normalize(path.join(root, requested));
  if (!file.startsWith(root)) return json(res, 403, { error: 'Forbidden' });
  fs.readFile(file, (error, content) => { if (error) return json(res, 404, { error: 'Not found' }); const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }; res.writeHead(200, { 'content-type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8` }); res.end(content); });
}
http.createServer(serve).listen(PORT, () => console.log(`Super Video running at http://localhost:${PORT}`));
