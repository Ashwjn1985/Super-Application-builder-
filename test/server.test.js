const test = require('node:test');
const assert = require('node:assert/strict');
const { safeProvider, extractText } = require('../server');

test('rejects non-HTTPS provider URLs', () => assert.throws(() => safeProvider({ name: 'jev', baseUrl: 'http://provider.test', apiKey: 'x', model: 'm' }), /HTTPS/));
test('rejects credential-bearing and query URLs', () => {
  assert.throws(() => safeProvider({ baseUrl: 'https://user:pass@provider.test/v1' }), /credentials/);
  assert.throws(() => safeProvider({ baseUrl: 'https://provider.test/v1?key=x' }), /credentials or query/);
});
test('extracts Responses and Chat Completions text', () => {
  assert.equal(extractText({ output_text: 'response' }), 'response');
  assert.equal(extractText({ choices: [{ message: { content: 'chat' } }] }), 'chat');
});
test('allows an HTTPS provider without storing secrets in the normalized public fields', () => {
  const provider = safeProvider({ name: 'astra', baseUrl: 'https://provider.test/v1', apiKey: 'secret', model: 'astra' });
  assert.equal(provider.baseUrl, 'https://provider.test/v1');
  assert.equal(provider.apiKey, 'secret');
});
