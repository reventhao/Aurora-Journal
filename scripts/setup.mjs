import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const targets = [
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env'],
  ['apps/admin/.env.example', 'apps/admin/.env'],
  ['apps/mobile/.env.example', 'apps/mobile/.env'],
];

function copyEnvFile(from, to) {
  const source = path.resolve(process.cwd(), from);
  const target = path.resolve(process.cwd(), to);

  if (!existsSync(source)) {
    process.stderr.write(`[setup] missing template: ${from}\n`);
    process.exitCode = 1;
    return;
  }

  if (existsSync(target)) {
    process.stdout.write(`[setup] keep existing ${to}\n`);
    return;
  }

  copyFileSync(source, target);
  process.stdout.write(`[setup] created ${to}\n`);
}

process.stdout.write('[setup] preparing local env files\n');
targets.forEach(([from, to]) => copyEnvFile(from, to));

process.stdout.write('\n[setup] next steps:\n');
process.stdout.write('  1. start PostgreSQL (local or `docker compose up -d postgres`)\n');
process.stdout.write('  2. run `pnpm db:generate`\n');
process.stdout.write('  3. run `pnpm db:migrate`\n');
process.stdout.write('  4. run `pnpm db:seed`\n');
process.stdout.write('  5. run `pnpm dev`\n');
