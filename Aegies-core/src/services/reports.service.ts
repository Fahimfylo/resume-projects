import { SCAN_HISTORY } from "@/constants";
import type { ScanHistoryItem } from "@/types";

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  return SCAN_HISTORY;
}

export async function deleteScanRecord(id: string): Promise<void> {
  return;
}

export async function exportScanRecord(id: string): Promise<void> {
  return;
}
