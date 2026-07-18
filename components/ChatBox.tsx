"use client";
import { useState } from "react";

export default function ChatBox() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;
    setIsLoading(true);
    setResponse(""); // Clear previous response

    try {
      // Send the user's input to your newly created route.ts file
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: input }),
      });

      const data = await res.json();

      // Display the AI's response on the screen
      if (data.reply) {
        setResponse(data.reply);
      } else {
        setResponse("Error: " + data.error);
      }
    } catch (error) {
      setResponse("Failed to connect to the API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-bold mb-4 text-black">AI Chat</h2>
      
      <div className="mb-4 p-3 h-48 overflow-y-auto bg-gray-100 rounded text-black whitespace-pre-wrap">
        {isLoading ? "Thinking..." : response || "Waiting for a prompt..."}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border p-2 rounded text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
