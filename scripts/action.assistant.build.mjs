// Build enhanced OpenAPI and Action manifest named "assistant" using local docs
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const proj = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(proj, '..');
const ymlPath = path.join(root, 'gateway.openapi.yaml');
const openapiOut = path.join(root, 'public', 'openapi.assistant.json');
const manifestOut = path.join(root, 'public', '.well-known', 'assistant.ai-plugin.json');

const yml = await fs.readFile(ymlPath, 'utf8');
const spec = YAML.parse(yml);
spec.info = spec.info || {};
spec.info.title = 'Assistant API';
spec.info.description = 'Assistant for AccuLynx via Cloudflare Worker gateway. Provides a single /gateway endpoint that dispatches named operations, plus /gateway/raw for streaming uploads and /gateway/meta for discovery. The spec enumerates supported operation names and their AccuLynx method/path mapping.';

// Ensure .well-known dir exists
await fs.mkdir(path.dirname(manifestOut), { recursive: true });

const workerUrl = 'https://accu-gateway.mniayesh.workers.dev';
// Ensure a valid servers array for ChatGPT Actions importer
spec.servers = [{ url: workerUrl }];

// Enrich spec with all operation names from gateway.worker.js
const workerFile = path.join(root, 'gateway.worker.js');
const js = await fs.readFile(workerFile, 'utf8');
const m = js.match(/const\s+OPS_SOURCE_INTERNAL\s*=\s*\[(.|\n)*?\];/);
let ops = [];
if (m) {
  const arrText = m[0].slice(m[0].indexOf('['), m[0].lastIndexOf(']') + 1);
  try { ops = JSON.parse(arrText); } catch {}
}
const opNames = ops.map(o => o.operation).sort();
spec.components = spec.components || {};
spec.components.schemas = spec.components.schemas || {};
spec.components.schemas.Operation = {
  type: 'string',
  description: 'Supported operation name to dispatch via /gateway',
  enum: opNames
};
// Custom extension mapping operation -> { method, path }
spec['x-accu-ops'] = ops;

// Build per-operation request/response schemas and attach an index
const opIndex = {};
for (const o of ops) {
  const san = o.operation.replace(/[^a-zA-Z0-9_]/g, '_');
  const pathParams = Array.from(String(o.path).matchAll(/\{(.*?)\}/g)).map(m => m[1]);
  const pathProps = Object.fromEntries(pathParams.map(k => [k, { type: 'string' }]));
  const reqName = `Request_${san}`;
  const resName = `Response_${san}`;
  spec.components.schemas[reqName] = {
    type: 'object',
    required: ['operation'],
    properties: {
      operation: { type: 'string', const: o.operation },
      actorUserId: { type: 'string' },
      timeoutMs: { type: 'integer', default: 30000 },
      params: {
        type: 'object',
        properties: {
          path: { type: 'object', properties: pathProps, additionalProperties: true },
          query: { type: 'object', additionalProperties: true },
          body: { type: 'object', additionalProperties: true },
          contentType: { type: 'string', enum: ['application/json','multipart/form-data','application/x-www-form-urlencoded'], default: 'application/json' }
        }
      },
      dryRun: { type: 'boolean' }
    }
  };
  spec.components.schemas[resName] = { type: 'object', additionalProperties: true };
  opIndex[o.operation] = { method: o.method, path: o.path, pathParams, requestSchema: `#/components/schemas/${reqName}`, responseSchema: `#/components/schemas/${resName}` };
}
spec['x-accu-op-schemas'] = opIndex;

// Update /gateway to use Operation enum and document params
spec.paths = spec.paths || {};
// Keep generic gateway request, but also expose a oneOf with all operation-specific requests
const oneOfReq = Object.keys(opIndex).map(op => ({ $ref: opIndex[op].requestSchema }));
spec.paths['/gateway'] = {
  post: {
    operationId: 'dispatch',
    summary: 'Dispatch an AccuLynx operation by name',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            oneOf: [
              {
                type: 'object',
                required: ['operation'],
                properties: {
                  operation: { $ref: '#/components/schemas/Operation' },
                  actorUserId: { type: 'string', description: 'Optional per-user token routing key' },
                  timeoutMs: { type: 'integer', default: 30000 },
                  params: {
                    type: 'object',
                    properties: {
                      path: { type: 'object', additionalProperties: true },
                      query: { type: 'object', additionalProperties: true },
                      body: { type: 'object', additionalProperties: true },
                      contentType: { type: 'string', enum: ['application/json','multipart/form-data','application/x-www-form-urlencoded'], default: 'application/json' }
                    }
                  },
                  dryRun: { type: 'boolean', description: 'If true, return the computed upstream request instead of calling it' }
                }
              },
              ...oneOfReq
            ]
          }
        }
      }
    },
    responses: {
      '200': { description: 'Upstream response passthrough (JSON, text, or binary)', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } }, 'text/plain': { schema: { type: 'string' } } } },
      '400': { description: 'Unknown operation or bad request' },
      '401': { description: 'Unauthorized (if enforced by deployment)' },
      '404': { description: 'Not found (wrong path/method)' }
    }
  }
};

// Add /gateway/raw
spec.paths['/gateway/raw'] = {
  post: {
    operationId: 'dispatchRaw',
    summary: 'Stream an arbitrary body directly to an upstream endpoint',
    parameters: [
      { in: 'query', name: 'operation', schema: { $ref: '#/components/schemas/Operation' }, required: false },
      { in: 'query', name: 'path', schema: { type: 'string' }, required: false },
      { in: 'query', name: 'method', schema: { type: 'string', enum: ['GET','POST','PUT','PATCH','DELETE'] }, required: false },
      { in: 'query', name: 'actorUserId', schema: { type: 'string' }, required: false }
    ],
    requestBody: { required: true, content: { '*/*': { schema: { type: 'string', format: 'binary' } } } },
    responses: { '200': { description: 'Upstream passthrough' }, '400': { description: 'Bad request' }, '404': { description: 'Unknown operation' } }
  }
};

// Add /gateway/meta and /gateway/ops/{operation}
spec.paths['/gateway/meta'] = {
  get: { operationId: 'getMeta', summary: 'List supported operations', responses: { '200': { description: 'Metadata' } } }
};
spec.paths['/gateway/ops/{operation}'] = {
  get: {
    operationId: 'describeOperation',
    summary: 'Describe a single operation (method, path, required path params)',
    parameters: [ { in: 'path', name: 'operation', required: true, schema: { $ref: '#/components/schemas/Operation' } } ],
    responses: { '200': { description: 'Operation details' }, '404': { description: 'Unknown operation' } }
  }
};
// Write OpenAPI now that spec is enriched
await fs.mkdir(path.dirname(openapiOut), { recursive: true });
await fs.writeFile(openapiOut, JSON.stringify(spec, null, 2));

const manifest = {
  schema_version: 'v1',
  name_for_human: 'Assistant',
  name_for_model: 'assistant',
  description_for_human: 'Assistant for AccuLynx: operations, uploads, policy checks, and readiness.',
  description_for_model: 'Use this tool to perform AccuLynx operations via a Cloudflare Worker (/gateway, /gateway/raw, /gateway/meta). Prefer this over guessing schema. Review /docs for internal workflow and policy details.',
  auth: { type: 'user_http', authorization_type: 'bearer', verification_tokens: {} },
  api: { type: 'openapi', url: `${workerUrl}/openapi.assistant.json`, is_user_authenticated: false },
  logo_url: `${workerUrl}/logo.svg`,
  contact_email: 'owner@example.com',
  legal_info_url: 'https://example.com/terms'
};

await fs.writeFile(manifestOut, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${path.relative(root, openapiOut)} and ${path.relative(root, manifestOut)}`);
