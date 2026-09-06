// Documentation is load-bearing here: the whole org exists because the obvious mental model
// of "pre-load the loader" is wrong in specific ways. So the docs are tested like code — for
// links that resolve, and for claims we have decided not to make.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = join(new URL('.', import.meta.url).pathname, '..');

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) return entry === 'node_modules' ? [] : markdownFiles(p);
    return p.endsWith('.md') ? [p] : [];
  });
}

const files = markdownFiles(root);

test('every relative link resolves', () => {
  const broken = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const [path] = target.split('#');
      if (!path) continue;
      const abs = resolve(dirname(file), path);
      if (!existsSync(abs)) broken.push(`${file.replace(root, '')} -> ${target}`);
    }
  }
  assert.deepEqual(broken, [], `broken relative links:\n  ${broken.join('\n  ')}`);
});

test('the docs do not make the claims this org exists to avoid', () => {
  // Each entry is a claim we investigated and rejected. If a doc starts making it again, the
  // architecture and the documentation have drifted apart, and the documentation is wrong.
  const forbidden = [
    [/shared runtime across (a )?navigation/i, 'a runtime is not carried across a navigation (ADR-0002)'],
    [/guarantees the browser will cache/i, 'caching is the browser\'s decision, not a guarantee'],
    [/one loader for (both|all) (flutter and rust|frameworks)/i, 'Flutter and Rust do not share a loading contract'],
    [/warm the loader by (running|executing)/i, 'executing a bootstrap starts the application (ADR-0001)'],
    [/download(ed)? once for all 35/i, 'HTTP caches are partitioned by site'],
  ];
  const findings = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const [pattern, why] of forbidden) {
      // A line that quotes the claim in order to reject it is fine; one that asserts it is not.
      for (const line of text.split('\n')) {
        if (pattern.test(line) && !/never|not |does not|cannot|do not|no |rather than|instead of|wrong|refus/i.test(line)) {
          findings.push(`${file.replace(root, '')}: "${line.trim().slice(0, 80)}" — ${why}`);
        }
      }
    }
  }
  assert.deepEqual(findings, [], findings.join('\n'));
});

test('every ADR states status, context, decision and consequences', () => {
  const adrs = files.filter((f) => f.includes('/decisions/ADR-'));
  assert.ok(adrs.length >= 4, `expected the decisions to be recorded, found ${adrs.length}`);
  for (const adr of adrs) {
    const text = readFileSync(adr, 'utf8');
    for (const section of ['## Status', '## Context', '## Decision', '## Consequences']) {
      assert.ok(text.includes(section), `${adr.replace(root, '')} has no ${section}`);
    }
    assert.match(text, /Accepted|Proposed|Superseded/, `${adr.replace(root, '')} has no decision state`);
  }
});

test('the adoption guides cover every framework the fleet ships, and MASH', () => {
  const guides = readdirSync(join(root, 'docs/adoption'));
  assert.deepEqual(guides.sort(), ['dioxus.md', 'flutter.md', 'leptos.md', 'mash.md']);
});

test('the README points at the documents a reader actually needs', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  for (const doc of ['architecture.md', 'prefetch-and-activation.md', 'pilot-plan.md', 'repos.md']) {
    assert.ok(readme.includes(doc), `README does not link ${doc}`);
  }
});
