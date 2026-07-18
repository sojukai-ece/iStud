export async function POST(req: Request) {
  const { userMessage } = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_AI_API_URL;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", 
      },
      body: JSON.stringify({
        model: "sojukai/helios-3",
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    return Response.json({ reply: data.choices[0].message.content });

  } catch (error) {
    return Response.json({ error: "AI Server is currently unreachable" }, { status: 500 });
  }
}
