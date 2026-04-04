import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import electronBinaryPath from 'electron';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDirectoryPath = path.dirname(currentFilePath);
const mainProcessEntryPath = path.resolve(scriptsDirectoryPath, '../electron/main.cjs');

const child = spawn(electronBinaryPath, [mainProcessEntryPath], {
  stdio: ['inherit', 'inherit', 'pipe'],
});

let stderrOutput = '';

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  stderrOutput += text;
  process.stderr.write(text);
});

child.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});

child.on('close', (code) => {
  if (stderrOutput.includes('libnspr4.so')) {
    process.stderr.write('\nElectron runtime dependency is missing on this Linux system.\n');
    process.stderr.write('Install dependencies and retry:\n');
    process.stderr.write(
      'sudo apt update && sudo apt install -y libnss3 libnspr4 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libgtk-3-0\n',
    );
  }
  process.exit(code ?? 1);
});
