import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const IVET_EMAIL = "ivet.salon@seznam.cz";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   NAČTENÍ SCHVÁLENÝCH RECENZÍ
========================================================= */

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


/* =========================================================
   NOVÁ RECENZE
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const review = String(body.review ?? "").trim();
    const rating = Number(body.rating);

    /* =========================
       KONTROLA DAT
    ========================== */

    if (!name || !email || !review) {
      return NextResponse.json(
        {
          error: "Prosím vyplňte všechna povinná pole.",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error: "Jméno je příliš dlouhé.",
        },
        { status: 400 }
      );
    }

    if (review.length > 3000) {
      return NextResponse.json(
        {
          error: "Recenze je příliš dlouhá.",
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

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Zadejte platnou e-mailovou adresu.",
        },
        { status: 400 }
      );
    }


    /* =========================
       ULOŽENÍ DO SUPABASE
    ========================== */

    const { data: insertedReview, error: insertError } =
      await supabaseAdmin
        .from("website_reviews")
        .insert({
          name,
          email,
          rating,
          review,
          approved: false,
        })
        .select(
          "id, name, email, rating, review, approval_token"
        )
        .single();

    if (insertError || !insertedReview) {
      console.error(
        "POST review insert error:",
        insertError
      );

      return NextResponse.json(
        {
          error: "Recenzi se nepodařilo uložit.",
        },
        { status: 500 }
      );
    }


    /* =========================
       SCHVALOVACÍ ODKAZ
    ========================== */

    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      console.error("APP_URL is missing");

      return NextResponse.json(
        {
          success: true,
          warning:
            "Recenze byla uložena, ale nepodařilo se vytvořit schvalovací e-mail.",
        }
      );
    }

    const approveUrl =
      `${appUrl}/api/reviews/approve` +
      `?id=${encodeURIComponent(insertedReview.id)}` +
      `&token=${encodeURIComponent(
        insertedReview.approval_token
      )}`;


    /* =========================
       HVĚZDIČKY
    ========================== */

    const stars =
      "★".repeat(rating) +
      "☆".repeat(5 - rating);


    /* =========================
       EMAIL
    ========================== */

    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing");

      return NextResponse.json(
        {
          success: true,
          warning:
            "Recenze byla uložena, ale e-mail nebyl odeslán.",
        }
      );
    }


    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeReview = escapeHtml(review);
    const safeStars = escapeHtml(stars);


    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          from:
            "Ateliér Ivet <onboarding@resend.dev>",

          to: [IVET_EMAIL],

          subject:
            `Nová recenze – ${name} – Ateliér Ivet`,

          html: `
<!DOCTYPE html>

<html lang="cs">

<head>
<meta charset="UTF-8">
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f1eb;
  font-family:Arial,sans-serif;
  color:#333;
">

<div style="
  max-width:650px;
  margin:30px auto;
  background:#ffffff;
  border:1px solid #d7c49c;
">


  <div style="
    background:#111111;
    padding:30px;
    text-align:center;
  ">

    <div style="
      color:#c7a66a;
      letter-spacing:4px;
      font-size:12px;
      margin-bottom:10px;
    ">
      ATELIÉR IVET
    </div>

    <h1 style="
      margin:0;
      color:#ffffff;
      font-family:Georgia,serif;
      font-size:27px;
      font-weight:normal;
    ">
      Nová recenze
    </h1>

  </div>


  <div style="
    padding:32px;
  ">

    <p style="
      margin-top:0;
      font-size:15px;
      line-height:1.6;
    ">
      Na stránkách Ateliéru Ivet byla odeslána
      nová recenze, která čeká na schválení.
    </p>


    <table
      cellpadding="0"
      cellspacing="0"
      style="
        width:100%;
        margin-top:25px;
        border-collapse:collapse;
      "
    >

      <tr>
        <td style="
          padding:10px 0;
          color:#777;
          width:120px;
        ">
          Jméno:
        </td>

        <td style="
          padding:10px 0;
          font-weight:bold;
        ">
          ${safeName}
        </td>
      </tr>


      <tr>
        <td style="
          padding:10px 0;
          color:#777;
        ">
          E-mail:
        </td>

        <td style="
          padding:10px 0;
        ">
          ${safeEmail}
        </td>
      </tr>


      <tr>
        <td style="
          padding:10px 0;
          color:#777;
        ">
          Hodnocení:
        </td>

        <td style="
          padding:10px 0;
          color:#d4af37;
          font-size:20px;
          letter-spacing:2px;
        ">
          ${safeStars}
        </td>
      </tr>

    </table>


    <div style="
      margin-top:25px;
      padding:20px;
      background:#f8f6f1;
      border-left:3px solid #c7a66a;
      font-family:Georgia,serif;
      font-size:16px;
      line-height:1.7;
    ">

      „${safeReview.replace(/\n/g, "<br>")}“

    </div>


    <div style="
      text-align:center;
      margin:35px 0 25px;
    ">

      <a
        href="${approveUrl}"
        style="
          display:inline-block;
          background:#111111;
          color:#ffffff;
          text-decoration:none;
          padding:16px 30px;
          font-size:13px;
          letter-spacing:2px;
          border:1px solid #111111;
        "
      >
        SCHVÁLIT RECENZI
      </a>

    </div>


    <p style="
      text-align:center;
      color:#888;
      font-size:12px;
      line-height:1.6;
    ">
      Dokud na tlačítko SCHVÁLIT RECENZI
      nekliknete, recenze nebude na webu veřejně
      zobrazena.
    </p>

  </div>


  <div style="
    border-top:1px solid #eee;
    padding:20px;
    text-align:center;
    color:#999;
    font-size:11px;
  ">
    Ateliér Ivet – systém recenzí
  </div>

</div>

</body>
</html>
          `,
        }),
      }
    );


    /* =========================
       KONTROLA RESEND
    ========================== */

    if (!emailResponse.ok) {
      const resendError =
        await emailResponse.text();

      console.error(
        "Resend error:",
        resendError
      );

      return NextResponse.json(
        {
          success: true,
          warning:
            "Recenze byla uložena, ale schvalovací e-mail se nepodařilo odeslat.",
        }
      );
    }


    /* =========================
       HOTOVO
    ========================== */

    return NextResponse.json({
      success: true,
      message:
        "Děkujeme. Recenze byla odeslána ke schválení.",
    });

  } catch (error) {
    console.error(
      "POST reviews error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Při odesílání recenze došlo k chybě.",
      },
      {
        status: 500,
      }
    );
  }
}
