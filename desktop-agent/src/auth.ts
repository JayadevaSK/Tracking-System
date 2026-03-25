import fs from 'fs';
import path from 'path';
import readline from 'readline';
import axios from 'axios';

const CONFIG_PATH = path.join(process.env.APPDATA || process.env.HOME || '.', 'work-tracker-agent', 'config.json');

interface Config {
  token: string;
  employeeId: string;
  employeeName: string;
  serverUrl: string;
}

export function loadConfig(): Config | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

export function saveConfig(config: Config): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function clearConfig(): void {
  try { fs.unlinkSync(CONFIG_PATH); } catch { /* ignore */ }
}

export async function promptLogin(serverUrl: string): Promise<Config> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n=== Work Tracker Agent Login ===');
  const username = await ask('Username: ');
  const password = await ask('Password: ');
  rl.close();

  try {
    const res = await axios.post(`${serverUrl}/api/auth/login`, { username, password });
    const { token, userId } = res.data;

    if (!token || !userId) {
      throw new Error('Login failed: invalid response from server. Make sure the backend is running on ' + serverUrl);
    }

    const config: Config = {
      token,
      employeeId: userId,
      employeeName: username,
      serverUrl,
    };

    saveConfig(config);
    console.log(`\nLogged in as ${username}. Agent starting...\n`);
    return config;
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to server at ${serverUrl}. Is the backend running? Start it with: npm run dev (in the project root)`);
    }
    if (err.response?.status === 401) {
      throw new Error('Invalid username or password.');
    }
    throw new Error(err.response?.data?.error?.message || err.message || 'Login failed');
  }
}
