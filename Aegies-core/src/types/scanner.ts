export type AnalysisResult = {
  fileName: string;
  fileSize: number;
  extension: string;
  hash: string;
  riskScore: number;
  riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  findings: string[];
  aiSummary?: any;
};

export type ScanInput = {
  scanType: 'file' | 'url';
  timestamp: string;
  riskScore: number;
  riskLevel: string;
  fileDetails?: {
    fileName: string;
    fileSize: number;
    declaredExtension: string;
    doubleExtensionDetected: boolean;
    dangerousExtension: boolean;
  };
};
