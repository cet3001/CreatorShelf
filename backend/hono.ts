import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "CreatorShelf API is running" });
});

function getSupabaseAdmin() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseUserAgent(ua: string): { device_type: string; os: string } {
  let os = "Unknown";
  let device_type = "Unknown";

  if (/iPhone/i.test(ua)) {
    os = "iOS";
    device_type = "Mobile";
  } else if (/iPad/i.test(ua)) {
    os = "iOS";
    device_type = "Tablet";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    device_type = /Mobile/i.test(ua) ? "Mobile" : "Tablet";
  } else if (/Windows/i.test(ua)) {
    os = "Windows";
    device_type = "Desktop";
  } else if (/Macintosh/i.test(ua)) {
    os = "macOS";
    device_type = "Desktop";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
    device_type = "Desktop";
  }

  return { device_type, os };
}

async function hashIp(ip: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + "creatorshelf-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  } catch {
    return "unknown";
  }
}

app.get("/r/:shortCode", async (c) => {
  const shortCode = c.req.param("shortCode");
  console.log("[Redirect] incoming request for short_code:", shortCode);

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.log("[Redirect] Supabase not configured");
    return c.text("Service unavailable", 503);
  }

  const { data: sparkCode, error } = await supabase
    .from("spark_codes")
    .select("*")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .single();

  if (error || !sparkCode) {
    console.log("[Redirect] spark_code not found for:", shortCode, error?.message);
    return c.text("Link not found", 404);
  }

  if (sparkCode.expires_at && new Date(sparkCode.expires_at) < new Date()) {
    console.log("[Redirect] spark_code expired:", shortCode);
    return c.text("This link has expired", 410);
  }

  const ua = c.req.header("user-agent") ?? "";
  const { device_type, os } = parseUserAgent(ua);
  const clientIp = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? 
                   c.req.header("x-real-ip") ?? 
                   "unknown";
  const ipHash = await hashIp(clientIp);

  const scanEvent = {
    spark_code_id: sparkCode.id,
    device_type,
    os,
    ip_hash: ipHash,
    country: null,
    city: null,
  };

  console.log("[Redirect] logging scan event:", JSON.stringify(scanEvent));
  const { error: insertError } = await supabase
    .from("scan_events")
    .insert(scanEvent);

  if (insertError) {
    console.log("[Redirect] failed to log scan event:", insertError.message);
  }

  let redirectUrl = sparkCode.destination_url;

  if (os === "iOS" && sparkCode.deep_link_ios) {
    redirectUrl = sparkCode.deep_link_ios;
  } else if (os === "Android" && sparkCode.deep_link_android) {
    redirectUrl = sparkCode.deep_link_android;
  }

  if (!redirectUrl) {
    return c.text("No destination configured for this link", 404);
  }

  console.log("[Redirect] redirecting to:", redirectUrl, "| device:", device_type, "| os:", os);
  return c.redirect(redirectUrl, 302);
});

export default app;
