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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const skip = Number(searchParams.get("skip")) || 0;

    const records = await ScanRecord.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ScanRecord.countDocuments({ userId: payload.userId });

    return NextResponse.json({ records, total }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);

    await connectDB();

    const body = await req.json();
    const record = await ScanRecord.create({
      userId: payload.userId,
      type: body.type,
      target: body.target,
      riskScore: body.riskScore,
      riskLevel: body.riskLevel,
      fileDetails: body.fileDetails,
      urlDetails: body.urlDetails,
      aiSummary: body.aiSummary,
    });

    return NextResponse.json(
      { record: { ...record.toObject(), id: record._id.toString() } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to save scan record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);

    await connectDB();

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const result = await ScanRecord.deleteMany({
      _id: { $in: ids },
      userId: payload.userId,
    });

    return NextResponse.json({ deleted: result.deletedCount }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete records" }, { status: 500 });
  }
}
