import { useState } from "react";
import axios from "axios";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const API_URL = "https://copbot-rec.onrender.com/get_response"; // Updated API URL

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "User", text: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      console.log(input)
      const response = await axios.post(API_URL, { prompt: input });
      
      const botMessage = { sender: "Bot", text: response.data.response }; // Adjusted key to "response"
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-2">Chatbot</h2>
      <div className="h-60 overflow-y-auto border p-2 mb-2 rounded">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 my-1 rounded ${msg.sender === "User" ? "bg-blue-200 text-right" : "bg-gray-200 text-left"}`}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
}
