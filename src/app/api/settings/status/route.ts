import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    exa: Boolean(process.env.EXA_API_KEY?.trim()),
    apify: Boolean(process.env.APIFY_API_TOKEN?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    gemini: Boolean(process.env.GOOGLE_AI_KEY?.trim()),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    zeroclick: Boolean(process.env.ZEROCLICK_API_KEY?.trim()),
    nevermined: Boolean(process.env.NVM_API_KEY?.trim()),
    nanobanana: Boolean(process.env.NANOBANANA_API_KEY?.trim()),
  });
}
