import { useState } from "react";
import axios from "axios";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const API_URL = "https://copbot-rec.onrender.com/get_response"; // Your API URL

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "User", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      console.log("User input:", input);
      const response = await axios.post(API_URL, { prompt: input });

      console.log("Raw API Response:", response.data); // Debugging output

      const botMessage = { sender: "Bot", text: formatBotResponse(response.data.response) };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "Bot", text: "Error retrieving response. Please try again later." },
      ]);
    }
  };

  // Helper function to extract JSON objects from text
  const extractJsonObjects = (text) => {
    const jsonRegex = /```json\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;
    
    while ((match = jsonRegex.exec(text)) !== null) {
      try {
        const jsonObj = JSON.parse(match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
        matches.push(jsonObj);
      } catch (e) {
        console.error("Failed to parse JSON in text:", e);
      }
    }
    
    return matches;
  };

  // Format a single legal code entry
  const formatLegalEntry = (data) => {
    return (
      `📝 Art Section: ${data["art section"] || "Not available"}\n\n` +
      `📂 Category: ${data["category"] || "Not available"}\n\n` +
      `⚖️ Punishment: ${data["Punishment"] || "Not available"}\n\n` +
      `👥 Applicable: ${data["Applicable"] || "Not available"}\n\n` +
      `📝 Brief Description: ${data["Brief description"] || "Not available"}`
    );
  };

  // Regular expression patterns for different response types
  const patterns = {
    numberedList: /^\d+\.\s.+/m,
    bulletList: /^[\*\-\•]\s.+/m,
    definition: /^.+:\s.+/m,
    errorMessage: /^⚠️\s+\*\*.*\*\*/
  };

  // Detect response type based on content
  const detectResponseType = (text) => {
    if (text.includes("```json")) {
      return "multipleJson";
    } else if (patterns.errorMessage.test(text)) {
      return "error";
    } else {
      try {
        // Try to parse as JSON
        const cleanedText = text.replace(/```json\n|\n```/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
        JSON.parse(cleanedText);
        return "singleJson";
      } catch (e) {
        // It's not valid JSON, treat as plain text
        return "plainText";
      }
    }
  };

  // ✅ Function to format the bot's response into a structured format
  const formatBotResponse = (response) => {
    try {
      const responseType = detectResponseType(response);
      
      switch(responseType) {
        case "multipleJson":
          return formatMultipleJsonResponse(response);
        
        case "singleJson":
          return formatSingleJsonResponse(response);
          
        case "error":
          return response; // Return error messages as-is
          
        case "plainText":
        default:
          return response; // Return plain text as-is
      }
    } catch (error) {
      console.error("Error formatting response:", error);
      // Fall back to raw response if all else fails
      return response;
    }
  };

  // Format multiple JSON objects in a response
  const formatMultipleJsonResponse = (response) => {
    const jsonObjects = extractJsonObjects(response);
    
    if (jsonObjects.length === 0) {
      return response; // No objects found, return original
    }
    
    // Get text before first JSON object
    const introText = response.split("```json")[0].trim();
    
    // Format the response with all JSON objects
    let formattedResponse = introText ? `${introText}\n\n` : "";
    
    jsonObjects.forEach((obj, index) => {
      // Check if it's a legal code entry
      if (obj["art section"] !== undefined) {
        // Remove the duplicated section title
        formattedResponse += formatLegalEntry(obj);
      } else {
        // Generic JSON object format
        formattedResponse += `**Entry ${index + 1}**\n\n`;
        Object.entries(obj).forEach(([key, value]) => {
          formattedResponse += `${key}: ${value}\n`;
        });
      }
      
      // Don't add separator after the last item
      if (index < jsonObjects.length - 1) {
        formattedResponse += `\n\n${"-".repeat(40)}\n\n`;
      }
    });
    
    return formattedResponse;
  };

  // Format a single JSON response
  const formatSingleJsonResponse = (response) => {
    try {
      const cleanedResponse = response.replace(/```json\n|\n```/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
      const data = JSON.parse(cleanedResponse);
      
      // Check if it's a legal code entry
      if (data["art section"] !== undefined) {
        return formatLegalEntry(data);
      } else {
        // Generic JSON format
        let formattedResponse = "";
        Object.entries(data).forEach(([key, value]) => {
          // Add emoji based on key type
          let emoji = "ℹ️";
          if (key.toLowerCase().includes("section")) emoji = "📝";
          else if (key.toLowerCase().includes("category")) emoji = "📂";
          else if (key.toLowerCase().includes("punishment")) emoji = "⚖️";
          else if (key.toLowerCase().includes("applicable")) emoji = "👥";
          else if (key.toLowerCase().includes("description")) emoji = "📄";
          
          formattedResponse += `${emoji} ${key}: ${value}\n\n`;
        });
        return formattedResponse;
      }
    } catch (error) {
      console.error("Error parsing single JSON:", error);
      return response;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-2">Chatbot</h2>

      <div className="h-60 overflow-y-auto border p-2 mb-2 rounded">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 my-1 rounded ${
              msg.sender === "User" ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
            }`}
          >
            {msg.sender === "User" ? (
              <>
                <strong>{msg.sender}:</strong> <pre className="whitespace-pre-wrap inline">{msg.text}</pre>
              </>
            ) : (
              <>
                <strong>{msg.sender}:</strong>
                <pre className="whitespace-pre-wrap mt-1">{msg.text}</pre>
              </>
            )}
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
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}