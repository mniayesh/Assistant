import worker from '../gateway.worker.js';

async function run() {
  const metaReq = new Request('https://example.com/gateway/meta');
  const metaRes = await worker.fetch(metaReq, {}, {});
  const meta = await metaRes.json();
  if (!meta.ok) throw new Error('meta not ok');
  if (!meta.counts || typeof meta.counts.total !== 'number' || typeof meta.counts.unique !== 'number') {
    throw new Error('counts missing in meta');
  }
  if (!Array.isArray(meta.operations)) throw new Error('operations not array');
  const set = new Set(meta.operations);
  if (set.size !== meta.operations.length) throw new Error('operations list not unique');
  console.log('Meta OK:', meta.counts);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

