export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.HF_TOKEN}`
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-R1", 
        messages: [{ role: "user", content: message }],
        max_tokens: 4096,
        temperature: 0.6,     
        stream: true           
      }),
    });

    if (!response.ok) {
       // Read the actual error from Hugging Face so we aren't guessing
       const errorData = await response.text(); 
       console.error("Hugging Face API Error:", response.status, errorData);
       
       return Response.json(
         { error: "Failed to fetch from HF", details: errorData }, 
         { status: response.status }
       );
    }

    // Stream the raw bytes directly back to the frontend
    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream" }
    });

  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "AI Server unreachable" }, { status: 500 });
  }
}
