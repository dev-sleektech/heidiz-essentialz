import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["DRAFT", "APPROVED", "DISMISSED"];

// Marks a generated draft reviewed. This never triggers anything outbound,
// it only records that a human looked at it, since there's no posting or
// email-sending integration behind this system, see the comment on
// ContentDraft in prisma/schema.prisma.
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ updated: false, message: "Not authorized." }, { status: 403 });
  }

  const { id } = await props.params;
  const { status } = await request.json().catch(() => ({ status: null }));

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ updated: false, message: "Invalid status." }, { status: 400 });
  }

  try {
    await prisma.contentDraft.update({ where: { id }, data: { status } });
    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json({ updated: false, message: "Draft not found." }, { status: 404 });
  }
}
