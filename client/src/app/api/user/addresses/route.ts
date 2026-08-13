import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("fictionfigure_session")?.value;
    if (!userId) return NextResponse.json({ addresses: [] });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ addresses });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("fictionfigure_session")?.value;
    const body = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const address = await prisma.address.create({
      data: {
        userId,
        fullName: body.fullName,
        streetAddress: body.streetAddress,
        apartment: body.apartment || null,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || "India",
        phone: body.phone,
        isDefault: body.isDefault || false,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save address" }, { status: 400 });
  }
}
