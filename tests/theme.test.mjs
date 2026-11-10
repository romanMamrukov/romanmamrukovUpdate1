import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function mount({ systemDark = false, saved = null, blocked = false } = {}) {
  const attributes = {};
  const meta = {};
  const dataset = {};
  let click;
  let systemChange;
  let stored = saved;
  const system = { matches: systemDark, addEventListener: (_, fn) => { systemChange = fn; } };
  const button = {
    setAttribute: (key, value) => { attributes[key] = value; },
    addEventListener: (_, fn) => { click = fn; }
  };
  const context = {
    localStorage: {
      getItem() { if (blocked) throw new Error('Storage blocked'); return stored; },
      setItem(_, value) { if (blocked) throw new Error('Storage blocked'); stored = value; }
    },
    document: {
      documentElement: { dataset },
      getElementById: () => ({ textContent: '' }),
      querySelector: selector => selector === '.theme-toggle' ? button :
        selector === 'meta[name="theme-color"]' ? { setAttribute: (key, value) => { meta[key] = value; } } : null
    },
    window: { matchMedia: () => system }
  };
  runInNewContext(bootstrap, context);
  runInNewContext(script, context);
  return { attributes, meta, dataset, click: () => click(), stored: () => stored,
    changeSystem(dark) { system.matches = dark; systemChange(); } };
}

for (const systemDark of [false, true]) {
  test(`automatic ${systemDark ? 'dark' : 'light'} theme keeps CSS in charge`, () => {
    const page = mount({ systemDark });
    assert.equal(page.dataset.theme, undefined);
    assert.equal(page.attributes['aria-pressed'], String(systemDark));
    assert.equal(page.meta.content, systemDark ? '#111611' : '#f3f1ea');
  });
}

for (const saved of ['light', 'dark']) {
  test(`saved ${saved} overrides the opposite system theme before paint`, () => {
    const page = mount({ saved, systemDark: saved === 'light' });
    assert.equal(page.dataset.theme, saved);
    assert.equal(page.attributes['aria-pressed'], String(saved === 'dark'));
    page.changeSystem(saved !== 'light');
    assert.equal(page.dataset.theme, saved);
  });
}

test('a theme click persists and updates both accessibility and browser colors', () => {
  const page = mount();
  page.click();
  assert.equal(page.dataset.theme, 'dark');
  assert.equal(page.stored(), 'dark');
  assert.equal(page.attributes['aria-label'], 'Switch to light theme');
  assert.equal(page.meta.content, '#111611');
  page.click();
  assert.equal(page.dataset.theme, 'light');
  assert.equal(page.stored(), 'light');
});

test('automatic theme responds when the operating-system preference changes', () => {
  const page = mount();
  page.changeSystem(true);
  assert.equal(page.attributes['aria-pressed'], 'true');
  assert.equal(page.meta.content, '#111611');
  assert.equal(page.dataset.theme, undefined);
});

test('blocked storage does not break rendering or manual switching', () => {
  const page = mount({ blocked: true, systemDark: true });
  assert.equal(page.attributes['aria-pressed'], 'true');
  assert.doesNotThrow(() => page.click());
  assert.equal(page.dataset.theme, 'light');
  assert.equal(page.attributes['aria-pressed'], 'false');
});

test('invalid saved values fall back to the operating-system preference', () => {
  const page = mount({ saved: 'unexpected', systemDark: true });
  assert.equal(page.dataset.theme, undefined);
  assert.equal(page.attributes['aria-pressed'], 'true');
});

test('project names are headings, summaries remain descriptive copy', () => {
  const names = [...html.matchAll(/<h3 class="project-name">([^<]+)<\/h3>/g)].map(match => match[1]);
  assert.deepEqual(names, ['Work to Income', 'Freelance IT Ops Console', 'Repair Marketplace',
    'Auto Repair Shop', 'Alus Bode', 'Entrega', 'QR Generator', 'Web Testbench']);
  assert.equal((html.match(/<p class="project-summary">/g) || []).length, 8);
  assert.equal((html.match(/<p class="project-description">/g) || []).length, 8);
  assert.ok(html.includes('https://www.self.so/romansmamrukovs-uc8yxi'));
});
