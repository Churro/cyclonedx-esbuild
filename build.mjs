// Reproducer for the spurious-subpath-component bug in @cyclonedx/cyclonedx-esbuild.
//
// Bundles src/index.ts (which imports `demo-lib` and `demo-lib/sub`) and generates a
// CycloneDX SBOM using the LOCAL build of the plugin under test.
//
// Expectation of a correct plugin: exactly one component for `demo-lib@1.0.0`.
// Buggy behaviour: an extra spurious component `demo-lib/sub@9.9.9` derived from the
// legacy subpath resolution stub node_modules/demo-lib/sub/package.json.
//
// esbuild and the plugin are loaded from the cyclonedx-esbuild repo next door, so
// rebuilding that repo (`npm run build`) changes what this reproducer exercises.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pluginRepo = join(here, '..', 'cyclonedx-esbuild');
const requireFromRepo = createRequire(join(pluginRepo, 'index.js'));

const esbuild = requireFromRepo('esbuild');
const { cyclonedxEsbuildPlugin } = requireFromRepo('./dist/plugin.js');

await esbuild.build({
  entryPoints: [join(here, 'src/index.ts')],
  absWorkingDir: here,
  bundle: true,
  outfile: join(here, 'dist/bundle.js'),
  platform: 'node',
  format: 'esm',
  treeShaking: true,
  target: 'node22',
  plugins: [
    cyclonedxEsbuildPlugin({
      outputReproducible: true,
      validate: true,
      outputFile: 'bom.json',
      logLevel: 'silent',
    }),
  ],
});

console.log('build complete -> dist/bom.json');
