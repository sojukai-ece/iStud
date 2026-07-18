export async function POST(req: Request) {
  try {
    // 1. EXTRACT 'message' instead of 'userMessage' to match the frontend payload
    const { message } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_AI_API_URL;

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", 
      },
      body: JSON.stringify({
        model: "sojukai/helios-3",
        messages: [{ role: "user", content: message }], // Use the extracted 'message'
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    // 2. ERROR CATCHING: If the AI API returns a 400 or 500, catch it before it crashes
    if (!response.ok) {
       console.error("LLM API Error:", data);
       return Response.json(
         { error: data.error?.message || "Failed to fetch from LLM API" }, 
         { status: response.status }
       );
    }
    
    return Response.json({ reply: data.choices[0].message.content });

  } catch (error) {
    // 3. LOG FATAL ERRORS: This prints the exact crash reason to your terminal/Vercel logs
    console.error("Internal Server Error:", error);
    return Response.json({ error: "AI Server is currently unreachable" }, { status: 500 });
  }
}
