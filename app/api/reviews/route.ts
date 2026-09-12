import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";


export async function GET() {
  const { data, error } = await supabase
    .from("website_reviews")
    .select("id, name, rating, review, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET reviews error:", error);

    return NextResponse.json(
      {
        reviews: [],
        error: "Recenze se nepodařilo načíst.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    reviews: data ?? [],
  });
}


export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const review = String(body.review ?? "").trim();
    const rating = Number(body.rating);

    if (!name || !email || !review) {
      return NextResponse.json(
        {
          error: "Prosím vyplňte všechna povinná pole.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          error: "Vyberte hodnocení 1 až 5 hvězdiček.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          error: "Zadejte platnou e-mailovou adresu.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("website_reviews")
      .insert({
        name,
        email,
        rating,
        review,
        approved: false,
      });

    if (error) {
      console.error("POST review error:", error);

      return NextResponse.json(
        {
          error: "Recenzi se nepodařilo uložit.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Děkujeme. Recenze byla odeslána ke schválení.",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Při odesílání recenze došlo k chybě.",
      },
      { status: 500 }
    );
  }
}
