#!/usr/bin/env node

const API_BASE = process.env.AEGISCORE_API || 'http://localhost:9002/api';
const TOKEN = process.env.AEGISCORE_TOKEN || '';

async function apiRequest(endpoint, method = 'POST', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Cookie'] = `token=${TOKEN}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

function printBanner() {
  console.log(`
  ╔══════════════════════════════════════╗
  ║       AEGISCORE — Security CLI       ║
  ║   Cybersecurity Defense Toolkit      ║
  ╚══════════════════════════════════════╝
  `);
}

function printTable(rows) {
  if (rows.length === 0) return console.log('  No results.');
  const keys = Object.keys(rows[0]);
  const colSizes = keys.map(k => Math.max(k.length, ...rows.map(r => String(r[k] || '').length)));
  const sep = '  ' + colSizes.map(s => '─'.repeat(s + 2)).join('┬');
  const fmt = (row) => '  ' + keys.map((k, i) => String(row[k] || '').padEnd(colSizes[i])).join(' │ ');
  console.log(sep);
  console.log(fmt(Object.fromEntries(keys.map(k => [k, k.toUpperCase()]))));
  console.log(sep.replace(/┬/g, '┼').replace(/^./, '├').replace(/.$/, '┤'));
  for (const row of rows) console.log(fmt(row));
  console.log(sep.replace(/┬/g, '┴').replace(/^./, '└').replace(/.$/, '┘'));
}

async function cmdScanFile(filePath) {
  printBanner();
  console.log(`  🔍 Scanning file: ${filePath}\n`);

  const fs = require('fs');
  const stats = fs.statSync(filePath);
  const fileName = filePath.split(/[\\/]/).pop();

  console.log(`  File: ${fileName}`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log('');

  const res = await apiRequest('/security/ioc/check', 'POST', {
    value: fileName,
    type: 'hash',
  });

  printTable([
    { indicator: fileName, type: 'file', score: `${res.confidenceScore}%`, risk: res.classification, source: res.sourceReferences?.[0]?.name || 'N/A' },
  ]);

  console.log(`\n  ${res.reputation}`);
}

async function cmdScanUrl(url) {
  printBanner();
  console.log(`  🔍 Scanning URL: ${url}\n`);

  const res = await apiRequest('/security/web/scan', 'POST', { url });

  console.log(`  Security Score: ${res.securityScore}/100`);
  console.log(`  SSL: ${res.sslValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Open Redirect: ${res.openRedirectDetected ? '⚠ Detected' : '✅ None'}`);
  console.log(`  Mixed Content: ${res.mixedContentDetected ? '⚠ Detected' : '✅ None'}`);
  console.log(`  Domain Age: ${res.whoisEstimatedAge}\n`);

  if (res.vulnerabilities.length > 0) {
    console.log('  Vulnerabilities:');
    printTable(res.vulnerabilities.map(v => ({
      type: v.type,
      severity: v.severity.toUpperCase(),
      description: v.description.slice(0, 60),
    })));
  }
}

async function cmdCheckIoc(value, type) {
  printBanner();
  console.log(`  🔍 Checking IOC: ${value} (${type})\n`);

  const res = await apiRequest('/security/ioc/check', 'POST', { value, type });

  printTable([
    {
      value: res.value,
      type: res.type,
      classification: res.classification,
      confidence: `${res.confidenceScore}%`,
      category: res.category,
    },
  ]);

  console.log(`\n  ${res.reputation}`);
}

async function cmdCheckEmail(email) {
  printBanner();
  console.log(`  🔍 Checking email: ${email}\n`);

  const res = await apiRequest('/security/breach/check', 'POST', { email });

  console.log(`  Breaches found: ${res.breachCount}`);
  console.log(`  Password change recommended: ${res.passwordChangeRecommended ? '✅ Yes' : '❌ No'}`);
  console.log(`\n  ${res.riskSummary}\n`);

  if (res.breaches.length > 0) {
    printTable(res.breaches.map(b => ({
      breach: b.name,
      year: b.year,
      fields: b.exposedFields.join(', '),
      severity: b.severity.toUpperCase(),
    })));
  }
}

async function cmdScore() {
  printBanner();
  console.log('  📊 Fetching Security Score...\n');

  const res = await apiRequest('/security/score', 'GET');

  console.log(`  Overall Score: ${res.overallScore}/100 (Grade: ${res.overallGrade})`);
  console.log('');

  printTable(res.categories.map(c => ({
    category: c.name,
    score: `${c.score}/100`,
    weight: `${c.weight}%`,
  })));

  console.log('');
  res.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    printBanner();
    console.log('  Usage:');
    console.log('    aegis scan <file>       — Scan a file for malware');
    console.log('    aegis scan-url <url>    — Scan a website for vulnerabilities');
    console.log('    aegis ioc <type> <val>  — Check IOC (ip|domain|url|hash)');
    console.log('    aegis breach <email>    — Check email for data breaches');
    console.log('    aegis score             — Get your security score');
    console.log('    aegis help              — Show this help');
    console.log('');
    console.log('  Environment:');
    console.log('    AEGISCORE_API   — API base URL (default: http://localhost:9002/api)');
    console.log('    AEGISCORE_TOKEN — Auth token for API');
    return;
  }

  switch (command) {
    case 'scan':
      if (!args[1]) throw new Error('Usage: aegis scan <file>');
      await cmdScanFile(args[1]);
      break;
    case 'scan-url':
      if (!args[1]) throw new Error('Usage: aegis scan-url <url>');
      await cmdScanUrl(args[1]);
      break;
    case 'ioc':
      if (!args[2]) throw new Error('Usage: aegis ioc <ip|domain|url|hash> <value>');
      await cmdCheckIoc(args[2], args[1]);
      break;
    case 'breach':
      if (!args[1]) throw new Error('Usage: aegis breach <email>');
      await cmdCheckEmail(args[1]);
      break;
    case 'score':
      await cmdScore();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "aegis help" for usage.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n  ❌ Error: ${err.message}`);
  process.exit(1);
});
