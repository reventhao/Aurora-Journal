import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const PNPM_COMMAND = 'pnpm';
const MOBILE_METRO_PORT = 8081;
const DEV_PORTS = {
  web: 5173,
  admin: 5174,
  mobile: MOBILE_METRO_PORT,
};
const API_HEALTH_URL = process.env.AURORA_API_READY_URL ?? 'http://127.0.0.1:3000/api/public/settings';
const API_WAIT_TIMEOUT_MS = Number(process.env.AURORA_API_WAIT_TIMEOUT_MS ?? 60000);
const API_WAIT_INTERVAL_MS = 1000;
const DEFAULT_SERVICES = ['web', 'admin'];
const SERVICE_DEFINITIONS = {
  web: {
    label: 'apps/web dev',
    args: ['--filter', '@aurora/web', 'dev'],
  },
  admin: {
    label: 'apps/admin dev',
    args: ['--filter', '@aurora/admin', 'dev'],
  },
  mobile: {
    label: 'apps/mobile dev',
    args: ['--filter', '@aurora/mobile', 'start'],
  },
};

const children = new Set();
let shuttingDown = false;

function parseRequestedServices(argv) {
  const servicesArg = argv.find((argument) => argument.startsWith('--services='));
  const requestedServices = servicesArg
    ? servicesArg
        .slice('--services='.length)
        .split(',')
        .map((service) => service.trim())
        .filter(Boolean)
    : [...DEFAULT_SERVICES];

  if (argv.includes('--mobile') && !requestedServices.includes('mobile')) {
    requestedServices.push('mobile');
  }

  const invalidServices = requestedServices.filter((service) => !(service in SERVICE_DEFINITIONS));
  if (invalidServices.length > 0) {
    throw new Error(`Unsupported services: ${invalidServices.join(', ')}`);
  }

  return Array.from(new Set(requestedServices));
}

function prefixStream(stream, prefix, target) {
  let buffer = '';

  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      target.write(`${prefix}${line}\n`);
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf('\n');
    }
  });

  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`${prefix}${buffer.replace(/\r$/, '')}\n`);
    }
  });
}

function spawnService(label, args) {
  const child = spawn(PNPM_COMMAND, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.add(child);
  prefixStream(child.stdout, `${label}: `, process.stdout);
  prefixStream(child.stderr, `${label}: `, process.stderr);

  child.on('error', (error) => {
    if (shuttingDown) {
      return;
    }

    process.stderr.write(`${label}: ${error.message}\n`);
    void shutdown(1);
  });

  child.on('exit', (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    if (code !== 0 || signal) {
      void shutdown(code ?? 1);
      return;
    }

    if (children.size === 0) {
      process.exit(0);
    }
  });

  return child;
}

async function isApiReady() {
  try {
    const response = await fetch(API_HEALTH_URL, {
      signal: AbortSignal.timeout(3000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApiReady() {
  const deadline = Date.now() + API_WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isApiReady()) {
      return true;
    }

    await delay(API_WAIT_INTERVAL_MS);
  }

  return false;
}

async function stopChild(child) {
  if (child.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  child.kill('SIGTERM');

  await Promise.race([
    new Promise((resolve) => child.once('exit', () => resolve())),
    delay(5000).then(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
    }),
  ]);
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await Promise.all([...children].map((child) => stopChild(child)));
  process.exit(exitCode);
}

async function ensureApi() {
  if (await isApiReady()) {
    process.stdout.write(`[dev] API already available at ${API_HEALTH_URL}\n`);
    return;
  }

  process.stdout.write(`[dev] Starting API and waiting for ${API_HEALTH_URL}\n`);
  spawnService('apps/api dev', ['--filter', '@aurora/api', 'start:dev']);

  const ready = await waitForApiReady();
  if (ready) {
    process.stdout.write('[dev] API is ready. Starting requested services.\n');
    return;
  }

  process.stderr.write(`[dev] API was not ready within ${API_WAIT_TIMEOUT_MS}ms.\n`);
  await shutdown(1);
}

async function killWindowsPort(port) {
  const command = [
    '$connection = Get-NetTCPConnection -LocalPort ' + port + ' -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;',
    'if ($connection) {',
    '  taskkill /PID $connection.OwningProcess /T /F | Out-Null;',
    '  Write-Output ("KILLED:" + $connection.OwningProcess)',
    '}',
  ].join(' ');

  await new Promise((resolve) => {
    const child = spawn('powershell', ['-NoProfile', '-Command', command], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      const output = chunk.trim();
      if (output) {
        process.stdout.write(`[dev] Released port ${port} by stopping ${output.replace(/^KILLED:/, 'PID ')}\n`);
      }
    });

    child.on('exit', () => resolve());
    child.on('error', () => resolve());
  });
}

async function killWindowsExpoStartProcesses() {
  const command = [
    '$processes = Get-CimInstance Win32_Process | Where-Object {',
    "  $_.Name -eq 'node.exe' -and $_.CommandLine -like '*expo*start*'",
    '};',
    'foreach ($process in $processes) {',
    '  taskkill /PID $process.ProcessId /T /F | Out-Null;',
    '  Write-Output ("KILLED_EXPO:" + $process.ProcessId)',
    '}',
  ].join(' ');

  await new Promise((resolve) => {
    const child = spawn('powershell', ['-NoProfile', '-Command', command], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      const output = chunk.trim();
      if (!output) {
        return;
      }

      output
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => {
          process.stdout.write(`[dev] Stopped stale Expo process ${line.replace(/^KILLED_EXPO:/, 'PID ')}\n`);
        });
    });

    child.on('exit', () => resolve());
    child.on('error', () => resolve());
  });
}

async function ensurePortAvailable(port, service) {
  if (process.platform !== 'win32') {
    return;
  }

  if (service === 'mobile') {
    await killWindowsExpoStartProcesses();
  }

  await killWindowsPort(port);
}

let requestedServices;

try {
  requestedServices = parseRequestedServices(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`[dev] ${error.message}\n`);
  process.exit(1);
}

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

await ensureApi();

if (!shuttingDown) {
  for (const service of requestedServices) {
    const port = DEV_PORTS[service];
    if (port) {
      await ensurePortAvailable(port, service);
    }
  }

  process.stdout.write(`[dev] Starting services: ${requestedServices.join(', ')}\n`);

  requestedServices.forEach((service) => {
    const definition = SERVICE_DEFINITIONS[service];
    spawnService(definition.label, definition.args);
  });
}
