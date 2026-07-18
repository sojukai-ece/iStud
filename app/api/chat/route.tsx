import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming request from your frontend
    const body = await req.json();
    const { prompt, model } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 2. Do your AI processing here (Call OpenAI, Gemini, etc.)
    // For now, this is your simulated response:
    const aiResponseText = `I am a Vercel API simulated response to: "${prompt}" using ${model}`;

    // 3. Send the response back to the frontend
    return NextResponse.json({ reply: aiResponseText });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
