import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/categories";

// Public read of the category list, mirroring /api/products. Server
// components import src/lib/categories.ts directly; this exists for client
// components that can't (and for anything that needs the list after the
// initial render).
export const revalidate = 60;

export async function GET() {
  const categories = await getAllCategories();
  return NextResponse.json({ categories });
}
