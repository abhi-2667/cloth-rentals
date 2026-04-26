const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const serverProcess = spawn(
  nodeBin,
  [path.join(rootDir, 'server', 'node_modules', 'nodemon', 'bin', 'nodemon.js'), path.join(rootDir, 'server', 'index.js')],
  {
    cwd: path.join(rootDir, 'server'),
    stdio: 'inherit',
    env: process.env,
  }
);

const clientProcess = spawn(
  nodeBin,
  [path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js'), '--config', path.join(rootDir, 'client', 'vite.config.js')],
  {
    cwd: path.join(rootDir, 'client'),
    stdio: 'inherit',
    env: process.env,
  }
);

let shuttingDown = false;

const shutdown = (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const childProcess of [serverProcess, clientProcess]) {
    if (!childProcess.killed) {
      childProcess.kill();
    }
  }

  process.exit(exitCode);
};

serverProcess.on('exit', (code, signal) => {
  if (signal || code !== 0) {
    shutdown(code ?? 1);
  }
});

clientProcess.on('exit', (code, signal) => {
  if (signal || code !== 0) {
    shutdown(code ?? 1);
  }
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
