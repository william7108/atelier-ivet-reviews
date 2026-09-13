import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id || !token) {
      return new NextResponse(
        `
        <html>
          <body style="font-family:Arial;padding:40px;text-align:center;">
            <h2>Neplatný odkaz</h2>
            <p>Chybí údaje potřebné ke schválení recenze.</p>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    const { data: review, error: findError } = await supabaseAdmin
      .from("website_reviews")
      .select("id, approved, approval_token")
      .eq("id", id)
      .eq("approval_token", token)
      .single();

    if (findError || !review) {
      return new NextResponse(
        `
        <html>
          <body style="font-family:Arial;padding:40px;text-align:center;">
            <h2>Recenze nebyla nalezena</h2>
            <p>Odkaz není platný nebo už není dostupný.</p>
          </body>
        </html>
        `,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    if (review.approved) {
      return new NextResponse(
        `
        <html>
          <body style="font-family:Arial;padding:40px;text-align:center;">
            <h2 style="color:#b7924f;">Recenze už je schválená</h2>
            <p>Tato recenze je již veřejně zobrazena.</p>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("website_reviews")
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("approval_token", token);

    if (updateError) {
      throw updateError;
    }

    return new NextResponse(
      `
      <html>
        <body style="
          font-family:Arial;
          padding:40px;
          text-align:center;
          background:#faf8f3;
          color:#333;
        ">
          <h1 style="color:#b7924f;">Recenze schválena</h1>
          <p>Recenze byla úspěšně schválena a nyní je veřejně zobrazena na stránce.</p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error("Approve review error:", error);

    return new NextResponse(
      `
      <html>
        <body style="font-family:Arial;padding:40px;text-align:center;">
          <h2>Došlo k chybě</h2>
          <p>Recenzi se nepodařilo schválit.</p>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }
}
