import { config } from 'dotenv';
config();

import '@/ai/flows/ai-url-risk-assessment.ts';
import '@/ai/flows/ai-threat-report-summary.ts';
import '@/ai/flows/ai-threat-intelligence.ts';
import '@/ai/flows/security/ai-email-phishing.ts';
