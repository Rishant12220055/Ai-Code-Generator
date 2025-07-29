import OpenAI from 'openai';
import axios from 'axios';
import { logger } from '../utils/logger.js';

class AIService {
  constructor() {
    this.openai = null;
    this.openRouterClient = null;
    this.initializeClients();
  }

  initializeClients() {
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize OpenRouter client
    if (process.env.OPENROUTER_API_KEY) {
      this.openRouterClient = axios.create({
        baseURL: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Component Generator Platform'
        }
      });
    }
  }

  async generateComponent(prompt, previousMessages = [], settings = {}) {
    const startTime = Date.now();
    try {
      const {
        model = process.env.AI_MODEL || 'gpt-4o-mini',
        temperature = 0.7,
        maxTokens = 2000
      } = settings;

      // Build conversation context
      const messages = this.buildConversationContext(prompt, previousMessages);
      let response;
      let tokensUsed = 0;

      if (model.startsWith('gemini')) {
        response = await this.callGemini(messages, { temperature, maxTokens });
        tokensUsed = response.usage?.total_tokens || 0;
      } else if (model.startsWith('gpt-') && this.openai) {
        response = await this.callOpenAI(messages, { model, temperature, maxTokens });
        tokensUsed = response.usage?.total_tokens || 0;
      } else if (this.openRouterClient) {
        response = await this.callOpenRouter(messages, { model, temperature, maxTokens });
        tokensUsed = response.usage?.total_tokens || 0;
      } else {
        throw new Error('No AI service available');
      }

      // Parse the response to extract component code
      // Gemini returns .candidates[0].content.parts[0].text
      let content;
      if (model.startsWith('gemini')) {
        content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        content = response.choices[0].message.content;
      }
      const componentData = this.parseComponentResponse(content);
      const processingTime = Date.now() - startTime;
      logger.info(`Component generated successfully in ${processingTime}ms using ${tokensUsed} tokens`);
      return {
        ...componentData,
        metadata: {
          model,
          tokens: tokensUsed,
          processingTime,
          temperature,
          maxTokens
        }
      };
    } catch (error) {
      logger.error('AI generation error:', error);
      throw new Error(`Failed to generate component: ${error.message}`);
    }
  }
  async callGemini(messages, settings) {
    // Gemini expects a single prompt string, so concatenate all user/assistant messages
    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const apiKey = process.env.GEMINI_API_KEY;
    const url = process.env.GEMINI_API_BASE_URL;
    try {
      const response = await axios.post(
        url + `?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: settings.temperature,
            maxOutputTokens: settings.maxTokens || 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Gemini API error:', error?.response?.data || error);
      throw new Error('Failed to call Gemini API');
    }
  }

  async refineComponent(prompt, currentComponent, previousMessages = [], settings = {}) {
    const startTime = Date.now();
    try {
      const {
        model = process.env.AI_MODEL || 'gpt-4o-mini',
        temperature = 0.7,
        maxTokens = 2000
      } = settings;

      // Build refinement context
      const messages = this.buildRefinementContext(prompt, currentComponent, previousMessages);
      let response;
      let tokensUsed = 0;

      if (model.startsWith('gemini')) {
        response = await this.callGemini(messages, { temperature, maxTokens });
        tokensUsed = response.usage?.total_tokens || 0;
      } else if (model.startsWith('gpt-') && this.openai) {
        response = await this.callOpenAI(messages, { model, temperature, maxTokens });
        tokensUsed = response.usage?.total_tokens || 0;
      } else if (this.openRouterClient) {
        response = await this.callOpenRouter(messages, { model, temperature, maxTokens });
        tokensUsed = response.usage?.total_tokens || 0;
      } else {
        throw new Error('No AI service available');
      }

      // Parse the response to extract component code
      let content;
      if (model.startsWith('gemini')) {
        content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        content = response.choices[0].message.content;
      }
      const refinedComponent = this.parseComponentResponse(content);
      const processingTime = Date.now() - startTime;
      logger.info(`Component refined successfully in ${processingTime}ms using ${tokensUsed} tokens`);
      return {
        ...refinedComponent,
        metadata: {
          model,
          tokens: tokensUsed,
          processingTime,
          temperature,
          maxTokens
        }
      };
    } catch (error) {
      logger.error('AI refinement error:', error);
      throw new Error(`Failed to refine component: ${error.message}`);
    }
  }

  buildConversationContext(prompt, previousMessages) {
    const systemPrompt = `You are an expert React component generator. Your task is to create high-quality, production-ready React components based on user descriptions.

Guidelines:
1. Generate clean, modern React components using functional components and hooks
2. Include comprehensive CSS styling with modern design principles
3. Use semantic HTML elements and proper accessibility attributes
4. Implement responsive design with mobile-first approach
5. Add hover states, transitions, and micro-interactions where appropriate
6. Follow React best practices and naming conventions
7. Include TypeScript types when beneficial
8. Make components reusable and configurable through props

Response format:
- Provide the complete JSX/TSX code for the component
- Include all necessary CSS styles
- Add a brief description of the component's purpose and features
- Suggest appropriate component name

Always respond with valid, executable code that can be rendered immediately.`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add previous conversation context (last 5 messages to avoid token limits)
    const recentMessages = previousMessages.slice(-5);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    return messages;
  }

  buildRefinementContext(prompt, currentComponent, previousMessages) {
    const systemPrompt = `You are refining an existing React component. The user wants to modify the current component based on their feedback.

Current Component:
Name: ${currentComponent.name}
Description: ${currentComponent.description}

JSX Code:
${currentComponent.jsx}

CSS Code:
${currentComponent.css}

Guidelines for refinement:
1. Make only the requested changes while preserving the component's core functionality
2. Maintain code quality and consistency
3. Ensure the refined component is still production-ready
4. Keep the same component structure unless major changes are requested
5. Update both JSX and CSS as needed
6. Preserve existing functionality that wasn't mentioned for change

Respond with the complete refined component code.`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation context
    const recentMessages = previousMessages.slice(-3);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: prompt });

    return messages;
  }

  async callOpenAI(messages, settings) {
    try {
      const response = await this.openai.chat.completions.create({
        model: settings.model,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      return response;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  async callOpenRouter(messages, settings) {
    try {
      const response = await this.openRouterClient.post('/chat/completions', {
        model: settings.model,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      return response.data;
    } catch (error) {
      logger.error('OpenRouter API error:', error);
      throw error;
    }
  }

  parseComponentResponse(content) {
    try {
      // Extract JSX/TSX code
      const jsxMatch = content.match(/```(?:jsx|tsx|javascript|typescript)?\n([\s\S]*?)\n```/);
      const jsxCode = jsxMatch ? jsxMatch[1] : '';

      // Extract CSS code
      const cssMatch = content.match(/```css\n([\s\S]*?)\n```/);
      const cssCode = cssMatch ? cssMatch[1] : '';

      // Extract component name (look for function/const declarations)
      const nameMatch = jsxCode.match(/(?:function|const)\s+(\w+)/);
      const componentName = nameMatch ? nameMatch[1] : 'GeneratedComponent';

      // Extract description from content
      const lines = content.split('\n');
      const descriptionLines = lines.filter(line => 
        !line.includes('```') && 
        line.trim() && 
        !line.includes('function') && 
        !line.includes('const') &&
        !line.includes('export')
      );
      
      const description = descriptionLines.slice(0, 2).join(' ').trim() || 
        `A ${componentName} component with modern styling and functionality.`;

      // If no code blocks found, try to extract from the entire content
      let finalJsx = jsxCode;
      let finalCss = cssCode;

      if (!jsxCode && content.includes('function') || content.includes('const')) {
        finalJsx = content;
      }

      if (!cssCode && content.includes('{') && content.includes('}')) {
        // Try to extract CSS-like content
        const cssLikeMatch = content.match(/\.[\w-]+\s*{[\s\S]*?}/g);
        if (cssLikeMatch) {
          finalCss = cssLikeMatch.join('\n\n');
        }
      }

      return {
        id: Date.now().toString(),
        jsx: finalJsx || this.getDefaultJSX(componentName),
        css: finalCss || this.getDefaultCSS(),
        name: componentName,
        description: description.substring(0, 500) // Limit description length
      };

    } catch (error) {
      logger.error('Error parsing component response:', error);
      
      // Return a default component if parsing fails
      return {
        id: Date.now().toString(),
        jsx: this.getDefaultJSX('GeneratedComponent'),
        css: this.getDefaultCSS(),
        name: 'GeneratedComponent',
        description: 'A generated component with basic functionality.'
      };
    }
  }

  getDefaultJSX(componentName) {
    return `function ${componentName}() {
  return (
    <div className="${componentName.toLowerCase()}">
      <h2>Generated Component</h2>
      <p>This is a placeholder component. Please try a more specific prompt.</p>
      <button className="btn">Click me</button>
    </div>
  );
}

export default ${componentName};

// Usage example:
function App() {
  return (
    <div className="app">
      <${componentName} />
    </div>
  );
}`;
  }

  getDefaultCSS() {
    return `.generated-component {
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.generated-component h2 {
  margin: 0 0 16px 0;
  color: #343a40;
  font-size: 24px;
  font-weight: 600;
}

.generated-component p {
  margin: 0 0 20px 0;
  color: #6c757d;
  line-height: 1.5;
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background: #0056b3;
}`;
  }

  async getAvailableModels() {
    try {
      const models = [];

      // Add OpenAI models if available
      if (this.openai) {
        models.push(
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
          { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
        );
      }

      // Add OpenRouter models if available
      if (this.openRouterClient) {
        models.push(
          { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'openrouter' },
          { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', provider: 'openrouter' },
          { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'openrouter' }
        );
      }

      return models;
    } catch (error) {
      logger.error('Error fetching available models:', error);
      return [];
    }
  }
}

const aiService = new AIService();

export const generateComponentFromPrompt = async (prompt, previousMessages = [], settings = {}) => {
  return await aiService.generateComponent(prompt, previousMessages, settings);
};

export default aiService;