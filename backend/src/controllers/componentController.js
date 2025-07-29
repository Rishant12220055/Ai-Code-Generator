import { generateComponentFromPrompt } from "../services/aiService.js";

// Controller to handle component generation
export const generateComponent = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const component = await generateComponentFromPrompt(prompt);
    res.status(200).json({ component });
  } catch (error) {
    console.error("Error generating component:", error);
    res.status(500).json({ error: "Failed to generate component" });
  }
};
