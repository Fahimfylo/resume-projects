import mongoose from 'mongoose';
import dns from 'dns';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { env } from './env.js';

const execFileAsync = promisify(execFile);

async function systemDnsServers() {
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execFileAsync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          '(Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | Select-Object -ExpandProperty ServerAddresses)',
        ],
        { timeout: 8000 }
      );
      const ips = stdout
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s));
      return [...new Set(ips)];
    } catch {
      return [];
    }
  }
  try {
    const fs = await import('fs');
    const resolv = await fs.promises.readFile('/etc/resolv.conf', 'utf8');
    return [...resolv.matchAll(/nameserver\s+([^\s]+)/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

export async function ensureDnsForMongo(uri) {
  if (!uri.startsWith('mongodb+srv://')) return;
  const host = uri
    .replace(/^mongodb\+srv:\/\//, '')
    .replace(/^[^@]*@/, '')
    .split('/')[0]
    .split('?')[0];

  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    return;
  } catch {
    /* fall through to system resolver */
  }

  const servers = await systemDnsServers();
  if (servers.length) {
    dns.setServers(servers);
  }
}

export async function connectDB() {
  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message);
  });

  await ensureDnsForMongo(env.MONGODB_URI);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: 'archflow',
    serverSelectionTimeoutMS: 15000,
  });

  console.log('[db] Connected to MongoDB:', mongoose.connection.host);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
