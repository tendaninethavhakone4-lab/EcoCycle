// Supabase Edge Function: send-email
// Wraps Resend so the API key never leaves Supabase.
// POST { to, subject, html }
// Auth: requires Authorization: Bearer <SUPABASE_ANON_KEY or SERVICE_ROLE_KEY>
// Secrets to set on Supabase:  RESEND_API_KEY, MAIL_FROM
//   supabase secrets set RESEND_API_KEY=re_xxx MAIL_FROM="ReclaimIQ <noreply@mmqtech.co.za>"

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { to, subject, html } = (await req.json()) as { to: string; subject: string; html: string };
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing to/subject/html" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("MAIL_FROM") || "ReclaimIQ <noreply@mmqtech.co.za>";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const body: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      return new Response(JSON.stringify({ error: body?.message || "Resend failed", details: body }), {
        status: r.status, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: body?.id }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
