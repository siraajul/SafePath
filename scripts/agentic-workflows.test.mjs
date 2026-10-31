import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'safepath-workflow-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const log = join(directory, 'requests.jsonl');
  const body = join(directory, 'body.md');
  const preload = join(directory, 'fetch.mjs');
  writeFileSync(body, 'A reviewable change.');
  writeFileSync(preload, `
    import { appendFileSync } from 'node:fs';
    globalThis.fetch = async (url, options) => {
      appendFileSync(process.env.REQUEST_LOG, JSON.stringify({url, method: options.method, body: options.body ? JSON.parse(options.body) : null}) + '\\n');
      return {
        ok: !process.env.MOCK_FAILURE,
        status: process.env.MOCK_FAILURE ? 403 : 200,
        text: async () => 'fixture-secret-do-not-print',
        json: async () => url.includes('/pulls?') ? [] : options.method === 'GET' ? {default_branch: 'main'} : {html_url: 'https://github.com/siraajul/SafePath/pull/7', number: 7},
      };
    };
  `);
  return {
    directory, body,
    run(args, overrides = {}) {
      return spawnSync(process.execPath, ['--import', preload, '.eas/agents/github.mjs', ...args], {
        cwd: root, encoding: 'utf8',
        env: { ...process.env, GITHUB_REPOSITORY: 'siraajul/SafePath', GITHUB_TOKEN: 'fixture-token', REQUEST_LOG: log, ...overrides },
      });
    },
    requests() {
      try { return readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); }
      catch { return []; }
    },
  };
}

test('generated pull requests are drafts and target the repository default branch', t => {
  const f = fixture(t);
  const result = f.run(['open-pull-request', 'agent/issue-7', 'feat(app): example', f.body]);
  assert.equal(result.status, 0, result.stderr);
  const request = f.requests().find(item => item.method === 'POST');
  assert.equal(request.body.draft, true);
  assert.equal(request.body.base, 'main');
});

test('issue creation does not receive the draft PR field', t => {
  const f = fixture(t);
  const result = f.run(['create-issue', 'TestFlight report', f.body, 'bug', 'testflight']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal('draft' in f.requests()[0].body, false);
});

test('invalid destinations and issue numbers are rejected before any API request', t => {
  const f = fixture(t);
  assert.notEqual(f.run(['issue', '7'], { GITHUB_REPOSITORY: 'someone/else' }).status, 0);
  assert.notEqual(f.run(['comment', '../pulls', f.body]).status, 0);
  assert.equal(f.requests().length, 0);
});

test('GitHub errors do not print response bodies that may contain credentials', t => {
  const f = fixture(t);
  const result = f.run(['issue', '7'], { MOCK_FAILURE: '1' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /403/);
  assert.doesNotMatch(result.stderr, /fixture-secret-do-not-print/);
});

test('missing CI credentials stop the runner and preflight before external tools run', () => {
  const env = { ...process.env };
  delete env.CODEX_API_KEY;
  for (const args of [
    ['.eas/agents/preflight.sh', '--simulator'],
    ['.eas/agents/run-agent.sh', '.eas/agents/check-pr.md', 'device'],
    ['.eas/agents/run-agent.sh', '.eas/agents/make-change.md', 'change'],
  ]) {
    const result = spawnSync('bash', args, { cwd: root, env, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /CODEX_API_KEY/);
  }
});

test('TestFlight formatting omits tester identity fields', t => {
  const f = fixture(t);
  const input = join(f.directory, 'feedback.json');
  const output = join(f.directory, 'issue.md');
  writeFileSync(input, JSON.stringify({ feedback: {
    comment: 'Navigation stopped responding', buildVersion: '1',
    testerName: 'Private Tester', testerEmail: 'private@example.invalid',
  } }));
  const result = spawnSync(process.execPath, ['.eas/agents/feedback-issue.mjs', input, output], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(output, 'utf8'), /Navigation stopped responding/);
  assert.doesNotMatch(readFileSync(output, 'utf8'), /Private Tester|private@example/);
});
