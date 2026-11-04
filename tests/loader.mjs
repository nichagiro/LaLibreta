import { pathToFileURL, URL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const subpath = specifier.slice(2);
    const srcDir = path.resolve(process.cwd(), 'src');
    const candidates = [
      path.join(srcDir, subpath),
      path.join(srcDir, `${subpath}.ts`),
      path.join(srcDir, `${subpath}.tsx`),
      path.join(srcDir, subpath, 'index.ts'),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && !fs.statSync(cand).isDirectory()) {
        return nextResolve(pathToFileURL(cand).href, context);
      }
    }
  }

  // Si es relativo sin extensión y termina existiendo con .ts
  if (specifier.startsWith('.') && !path.extname(specifier)) {
    const parentDir = context.parentURL ? path.dirname(new URL(context.parentURL).pathname.replace(/^\/([A-Z]:)/, '$1')) : process.cwd();
    const cand = path.resolve(parentDir, `${specifier}.ts`);
    if (fs.existsSync(cand)) {
      return nextResolve(pathToFileURL(cand).href, context);
    }
  }

  return nextResolve(specifier, context);
}
