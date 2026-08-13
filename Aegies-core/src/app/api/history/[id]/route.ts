import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import { ScanRecord } from "@/lib/models/ScanRecord";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);

    const { id } = await params;
    await connectDB();

    const record = await ScanRecord.findOneAndDelete({ _id: id, userId: payload.userId });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
