// Generates operations.generated.js from gateway.openapi.yaml (renamed to ops.generate.mjs)
// Requires: npm i yaml
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const root = path.dirname(new URL(import.meta.url).pathname);
const cwd = path.resolve(root, '..');
const openapiPath = path.join(cwd, 'gateway.openapi.yaml');
const outPath = path.join(cwd, 'operations.generated.js');

function toOperationId(method, p) {
  // Try to preserve existing naming: method + path segments, camel-ish
  const segs = p.split('/').filter(Boolean).map(s => s.replace(/\{.*?\}/g, 'By')); // {id} -> By
  const raw = [method.toLowerCase(), ...segs].join('_');
  return raw.replace(/[-{}]/g, '_');
}

const file = await fs.readFile(openapiPath, 'utf8');
const doc = YAML.parse(file);
const paths = doc.paths || {};
const ops = [];
for (const [p, methods] of Object.entries(paths)) {
  for (const [m, op] of Object.entries(methods)) {
    const method = m.toUpperCase();
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) continue;
    const operation = op['x-gateway-operation'] || op.operationId || toOperationId(method, p);
    ops.push({ operation, method, path: p });
  }
}

const content = `// Generated from gateway.openapi.yaml\nexport const OPS_SOURCE = ${JSON.stringify(ops, null, 2)};\n`;
await fs.writeFile(outPath, content);
console.log(`Wrote ${ops.length} operations to ${path.relative(cwd, outPath)}`);
