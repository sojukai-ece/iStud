export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Point directly to the Hugging Face Router
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 2. Authorize the request using your secure server-side token
        "Authorization": `Bearer ${process.env.HF_TOKEN}`
      },
      body: JSON.stringify({
        // 3. Ensure this exactly matches your model's repository ID on Hugging Face
        model: "deepseek-ai/DeepSeek-V3", 
        messages: [{ role: "user", content: message }],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    const rawText = await response.text(); 
    
    if (!response.ok) {
       console.error("Hugging Face API Failed. Raw Response:", rawText);
       return Response.json(
         { error: "Failed to fetch from Hugging Face API" }, 
         { status: response.status }
       );
    }
    
    const data = JSON.parse(rawText);
    
    return Response.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return Response.json({ error: "AI Server is currently unreachable" }, { status: 500 });
  }
}
