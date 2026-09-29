#!/usr/bin/env node
/**
 * PASAbi design guard — run in CI or before a demo:  node scripts/check-design.mjs [srcDir]
 * Fails (exit 1) when UI code breaks a DESIGN_BRIEF.md rule that a grep can catch:
 *  - banned words in string literals (BR-017, voice rules)
 *  - hex colours outside src/design/theme.ts (every colour must be a token)
 *  - emoji in source (icons are pictograms, never emoji)
 *  - ALL-CAPS string literals of 2+ words (only stamps are caps, via textTransform)
 * It is a tripwire, not a proof. The Design Council pass (DESIGN_COUNCIL.md) is still required.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] ?? 'src';
const BANNED = [/\bsuccessfully\b/i, /\bplease\b/i, /\boops\b/i, /\bverified\b/i, /\bconfirmed\b/i, /\bseverity\b/i, /\bdanger level\b/i, /\ball clear\b/i];
const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const STRING = /(['"`])((?:\\.|(?!\1).)*)\1/g;

const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (n === 'node_modules' || n.startsWith('.')) continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(n)) files.push(p);
  }
})(root);

const problems = [];
for (const f of files) {
  const rel = relative(process.cwd(), f);
  const isTheme = f.endsWith(`design${sep}theme.ts`);
  const isCopy = f.endsWith(`design${sep}copy.ts`);
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    if (/^\s*(\*|\/\*)/.test(line)) return; // comments
    for (const m of code.matchAll(STRING)) {
      const s = m[2];
      if (!isCopy || !/BANNED_WORDS/.test(line)) {
        for (const b of BANNED) if (b.test(s) && !/BANNED/.test(line)) problems.push(`${rel}:${i + 1}  banned word "${s.match(b)[0]}"`);
      }
      if (/^[A-Z]{2,}(\s+[A-Z]{2,})+$/.test(s.trim()) && !/^[A-Z_]+$/.test(s.trim())) problems.push(`${rel}:${i + 1}  ALL-CAPS copy "${s}" (use textTransform on stamps only)`);
      if (!isTheme && HEX.test(s)) problems.push(`${rel}:${i + 1}  raw colour ${s.match(HEX)[0]} (use a theme token)`);
    }
    if (EMOJI.test(code)) problems.push(`${rel}:${i + 1}  emoji in source (use a pictogram)`);
  });
}

if (problems.length) {
  console.error(`PASAbi design guard: ${problems.length} problem(s)\n` + problems.join('\n'));
  process.exit(1);
}
console.log(`PASAbi design guard: ${files.length} files clean.`);
