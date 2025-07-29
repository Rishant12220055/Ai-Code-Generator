import axios from 'axios';

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiBaseUrl = 'https://api.gemini.com/v1/'; // Temporarily hardcoded for debugging

console.log('Gemini Base URL:', geminiBaseUrl); // Log the baseURL for debugging

// Create an Axios instance for Gemini API
const geminiClient = axios.create({
  baseURL: geminiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-GEMINI-APIKEY': geminiApiKey
  }
});

// Example: Fetch account balances
export const getAccountBalances = async () => {
  try {
    const response = await geminiClient.get('balances', {
      auth: {
        username: geminiApiKey,
        password: geminiApiKey
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching account balances:', error);
    throw error;
  }
};

// Example: Place an order
export const placeOrder = async (orderDetails) => {
  try {
    const response = await geminiClient.post('order/new', orderDetails, {
      auth: {
        username: geminiApiKey,
        password: geminiApiKey
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};
