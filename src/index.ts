// Import BOTH the real package root and its legacy subpath, exactly like an app that
// uses `@hookform/resolvers` and `@hookform/resolvers/zod`.
import { root } from 'demo-lib';
import { sub } from 'demo-lib/sub';

console.log(root, sub);
