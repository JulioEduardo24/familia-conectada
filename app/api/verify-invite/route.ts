import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();
  const expected = process.env.FAMILY_INVITE_CODE;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "El servidor no tiene configurado FAMILY_INVITE_CODE." },
      { status: 500 }
    );
  }

  if (typeof code !== "string" || code.trim() !== expected) {
    return NextResponse.json(
      { ok: false, error: "Código de invitación incorrecto." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
