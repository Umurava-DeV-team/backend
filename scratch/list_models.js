const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Note: The SDK doesn't have a direct 'listModels' in the client sometimes depending on version, 
    // but we can try to fetch the list via the underlying REST API or just try common names.
    console.log("Checking API Key:", process.env.GEMINI_API_KEY.substring(0, 8) + "...");
    
    // Let's try a direct fetch to the list models endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName})`);
      });
    } else {
      console.log("No models returned. Error:", JSON.stringify(data));
    }
  } catch (error) {
    console.error("Failed to list models:", error);
  }
}

listModels();
