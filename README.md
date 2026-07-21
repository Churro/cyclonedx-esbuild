# Reproducer: spurious subpath component in `@cyclonedx/cyclonedx-esbuild`

Minimal, self-contained reproducer for a bug where the esbuild SBOM plugin emits a
**spurious extra component** for a package's legacy *subpath resolution directory*.

## The bug

Some packages ship a nested `package.json` inside a subpath directory so older bundlers
can resolve `pkg/subpath` without an `exports` map. Real-world example — `@hookform/resolvers`:

```
node_modules/@hookform/resolvers/package.json          name: "@hookform/resolvers"      version: 5.2.2   (real)
node_modules/@hookform/resolvers/zod/package.json       name: "@hookform/resolvers/zod"  version: 1.0.0   (stub)
```

`@hookform/resolvers/zod` is **not** an installable npm package — it is only an import
subpath. Its `package.json` has a non-installable name (two slashes) and a placeholder
version. cyclonedx-esbuild walked up from the bundled subpath file, found this stub, and
accepted it (`isValidPackageJSON` only checked that `name`/`version` were strings), producing
a phantom component `@hookform/resolvers/zod@1.0.0` alongside the real one.
`rollup-plugin-sbom` does not emit this component.

This project reproduces it with a fake `demo-lib` that mirrors the same layout
(`demo-lib` + `demo-lib/sub`).

## Run

```sh
node build.mjs     # bundles src/index.ts + generates dist/bom.json using ../cyclonedx-esbuild
node verify.mjs    # exits 1 if the spurious `demo-lib/sub@9.9.9` component is present, 0 if not
```

It loads esbuild and the plugin from the sibling `../cyclonedx-esbuild` checkout, so rebuild
that repo (`npm run build`) to switch between the buggy and patched plugin.

- **Before the fix:** SBOM contains `demo-lib@1.0.0` **and** `demo-lib/sub@9.9.9` → `verify.mjs` exits 1.
- **After the fix:** SBOM contains only `demo-lib@1.0.0` → `verify.mjs` exits 0.

## The fix

In `cyclonedx-esbuild` `src/_helpers.ts`, `isValidPackageJSON` now also requires the `name`
to be a valid npm package name (`isValidNpmPackageName`): unscoped names have no `/`, scoped
names are exactly `@scope/name`. Subpath-directory stubs like `@hookform/resolvers/zod` are
rejected, so `getPackageConfig` keeps walking up and attributes the module to the real
owning package. Covered by `tests/unit/helpers.test.js`.
