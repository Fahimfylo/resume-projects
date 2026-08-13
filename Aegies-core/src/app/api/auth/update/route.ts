import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const { name, image } = await req.json();

    await connectDB();

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    const user = await User.findByIdAndUpdate(payload.userId, updateData, {
      new: true,
      select: "-password",
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { user: { id: user._id.toString(), name: user.name, email: user.email, image: user.image || "" } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
