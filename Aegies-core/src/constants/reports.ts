import type { ScanHistoryItem } from "@/types";

export const SCAN_HISTORY: ScanHistoryItem[] = [
  { id: 'SCN-1029', type: 'file', target: 'invoice.pdf.exe', date: '2025-05-12 14:22', score: 92, level: 'Critical' },
  { id: 'SCN-1028', type: 'url', target: 'https://paypa1-verify.net', date: '2025-05-12 11:05', score: 85, level: 'High' },
  { id: 'SCN-1027', type: 'file', target: 'profile_pic.png', date: '2025-05-11 18:45', score: 5, level: 'Safe' },
  { id: 'SCN-1026', type: 'file', target: 'system_update.bat', date: '2025-05-11 12:20', score: 65, level: 'High' },
  { id: 'SCN-1025', type: 'url', target: 'https://github.com', date: '2025-05-10 09:12', score: 2, level: 'Safe' },
  { id: 'SCN-1024', type: 'file', target: 'manual.pdf', date: '2025-05-10 08:30', score: 10, level: 'Safe' },
];
