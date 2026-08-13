export type ScanHistoryItem = {
  id: string;
  type: 'file' | 'url';
  target: string;
  date: string;
  score: number;
  level: 'Safe' | 'High' | 'Critical';
};
