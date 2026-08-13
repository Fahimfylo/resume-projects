import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import { ScanRecord } from "@/lib/models/ScanRecord";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    await connectDB();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const allRecords = await ScanRecord.find({ userId: payload.userId }).sort({ createdAt: -1 }).lean();
    const recentRecords = allRecords.filter((r) => new Date(r.createdAt) >= sevenDaysAgo);
    const prevRecords = allRecords.filter(
      (r) => new Date(r.createdAt) >= fourteenDaysAgo && new Date(r.createdAt) < sevenDaysAgo
    );

    const totalScans = allRecords.length;
    const fileScans = allRecords.filter((r) => r.type === "file").length;
    const urlScans = allRecords.filter((r) => r.type === "url").length;
    const threatsBlocked = allRecords.filter((r) =>
      ["Medium", "High", "Critical"].includes(r.riskLevel)
    ).length;
    const safeItems = allRecords.filter((r) =>
      ["Safe", "Low"].includes(r.riskLevel)
    ).length;

    const recentThreats = recentRecords.filter((r) =>
      ["Medium", "High", "Critical"].includes(r.riskLevel)
    ).length;
    const prevThreats = prevRecords.filter((r) =>
      ["Medium", "High", "Critical"].includes(r.riskLevel)
    ).length;

    const avgRisk =
      totalScans > 0
        ? Math.round(allRecords.reduce((s, r) => s + r.riskScore, 0) / totalScans)
        : 0;

    const recentSafe = recentRecords.filter((r) =>
      ["Safe", "Low"].includes(r.riskLevel)
    ).length;
    const prevSafe = prevRecords.filter((r) =>
      ["Safe", "Low"].includes(r.riskLevel)
    ).length;

    const trendThreats = recentThreats > prevThreats ? "+" : "-";
    const threatDiff = prevThreats > 0 ? Math.round(Math.abs(recentThreats - prevThreats) / prevThreats * 100) : recentThreats * 100;

    const trendSafe = recentSafe >= prevSafe ? "+" : "-";
    const safeDiff = prevSafe > 0 ? Math.round(Math.abs(recentSafe - prevSafe) / prevSafe * 100) : recentSafe * 100;

    const chartData: { name: string; scans: number; threats: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toLocaleDateString("en-US", { weekday: "short" });
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayScans = allRecords.filter(
        (r) => new Date(r.createdAt) >= dayStart && new Date(r.createdAt) < dayEnd
      );
      chartData.push({
        name: dayStr,
        scans: dayScans.length,
        threats: dayScans.filter((r) => ["Medium", "High", "Critical"].includes(r.riskLevel)).length,
      });
    }

    const alerts = allRecords
      .filter((r) => ["High", "Critical"].includes(r.riskLevel))
      .slice(0, 5)
      .map((r) => {
        const mins = Math.round(
          (now.getTime() - new Date(r.createdAt).getTime()) / 60000
        );
        return {
          type: r.type === "file" ? "File Blocked" : "Phishing Detected",
          target: r.target,
          time: mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`,
        };
      });

    return NextResponse.json({
      stats: {
        totalScans,
        fileScans,
        urlScans,
        threatsBlocked,
        safeItems,
        avgRisk,
        trendThreats,
        threatDiff,
        trendSafe,
        safeDiff,
      },
      chartData,
      alerts,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
