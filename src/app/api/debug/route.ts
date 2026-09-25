import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    supabaseUrl: env.supabase.url,
    supabaseAnonKey: env.supabase.anonKey,
    // For safety, do not expose service role key
    hasServiceKey: !!env.supabase.serviceRoleKey,
    nodeEnv: env.nodeEnv,
  });
}