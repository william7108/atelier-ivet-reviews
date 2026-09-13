import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "BREVO_API_KEY ve Vercelu nebyl nalezen.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Ateliér Ivet",
            email: "ivet.salon@seznam.cz",
          },

          to: [
            {
              email: "ivet.salon@seznam.cz",
              name: "Ateliér Ivet",
            },
          ],

          subject: "TEST – Ateliér Ivet recenze",

          htmlContent: `
            <h2>Test e-mailu</h2>
            <p>
              Pokud tento e-mail dorazil,
              propojení Vercel → Brevo funguje správně.
            </p>
          `,
        }),
      }
    );

    const result = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          brevo: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      brevo: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Neznámá chyba.",
      },
      { status: 500 }
    );
  }
}
