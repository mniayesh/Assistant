// Converts gateway.openapi.yaml to public/openapi.json for ChatGPT Actions import
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const repoRoot = path.dirname(new URL(import.meta.url).pathname);
const proj = path.resolve(repoRoot, '..');
const src = path.join(proj, 'gateway.openapi.yaml');
const outDir = path.join(proj, 'public');
const out = path.join(outDir, 'openapi.json');

const yml = await fs.readFile(src, 'utf8');
const json = YAML.parse(yml);
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(out, JSON.stringify(json, null, 2));
console.log(`Wrote ${path.relative(proj, out)}`);

