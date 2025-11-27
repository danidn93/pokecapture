import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { google } from "npm:googleapis@140";
import { OAuth2Client } from "npm:google-auth-library@9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeRecipients(input: any): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, username, gifUrl } = await req.json();

    const to = normalizeRecipients(email);

    if (!to || !username || !gifUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "Campos incompletos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // OAuth2 Client
    const oauth2Client = new OAuth2Client(
      Deno.env.get("GOOGLE_CLIENT_ID"),
      Deno.env.get("GOOGLE_CLIENT_SECRET"),
      "https://developers.google.com/oauth2"
    );

    oauth2Client.setCredentials({
      refresh_token: Deno.env.get("GOOGLE_REFRESH_TOKEN"),
    });

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    // HTML del correo
    const html =
      `
      <div style="font-family: Arial; text-align:center; padding:20px;">
        <h1 style="color:#ffcb05;">¡Bienvenido, ${username}!</h1>

        <p style="font-size:16px;">Tu aventura Pokémon está por comenzar en <b>PokeCapture</b>.</p>

        <img src="${gifUrl}" style="max-width:300px;border-radius:12px;margin:20px auto;" />

        <p style="font-size:15px;">Atrapa Pokémon, completa tu Pokédex y conviértete en un maestro Pokémon.</p>

        <p style="margin-top:20px;font-weight:bold;">¡Buena suerte, entrenador!⚡🔥</p>
      </div>
      `;

    const subject = "¡Bienvenido a PokeCapture! ⚡🔥";

    // Crear MIME (sin adjuntos)
    const mimeBody =
      `From: ${Deno.env.get("GMAIL_USER")}\r\n` +
      `To: ${to}\r\n` +
      `Subject: =?UTF-8?B?${btoa(
        unescape(encodeURIComponent(subject))
      )}?=\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
      html;

    const raw = btoa(unescape(encodeURIComponent(mimeBody)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        id: result.data.id,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ SEND WELCOME EMAIL ERROR:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
