import { aiDailySecurityBrief } from "@/ai/flows/ai-threat-intelligence";
import type { DailyBriefOutput } from "@/ai/flows/ai-threat-intelligence";
import { getLiveThreatFeed, getThreatFeedSummary } from "./security/threat-intel.service";
import type { LiveThreatFeedEntry, ThreatFeedSummary } from "@/types/security/threat-intel";

export async function fetchDailyBrief(): Promise<DailyBriefOutput | null> {
  try {
    const data = await aiDailySecurityBrief({});
    return data;
  } catch (error) {
    console.error("Failed to load brief", error);
    return null;
  }
}

export function fetchLiveFeed(limit?: number): LiveThreatFeedEntry[] {
  return getLiveThreatFeed(limit);
}

export function fetchFeedSummary(feed: LiveThreatFeedEntry[]): ThreatFeedSummary {
  return getThreatFeedSummary(feed);
}
