// Inspects dist/bom.json and reports whether the spurious subpath component is present.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const bom = JSON.parse(readFileSync(join(here, 'dist/bom.json'), 'utf8'));

const demoComponents = (bom.components ?? [])
  .filter((c) => (c.name ?? '').includes('demo-lib') || (c.purl ?? '').includes('demo-lib'))
  .map((c) => `${c.purl ?? `${c.group ? c.group + '/' : ''}${c.name}@${c.version}`}`);

console.log('demo-lib components in SBOM:');
for (const c of demoComponents) console.log('  -', c);

const spurious = demoComponents.filter((p) => p.includes('sub') && p.includes('9.9.9'));
if (spurious.length > 0) {
  console.log('\nRESULT: BUG PRESENT — spurious subpath component emitted:', spurious.join(', '));
  process.exit(1);
} else {
  console.log('\nRESULT: OK — no spurious subpath component. demo-lib/sub is correctly attributed to demo-lib.');
  process.exit(0);
}
