const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let activeModelName = null;

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
].filter(Boolean);

const getGeminiClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getGeminiModel = () => {
  const client = getGeminiClient();

  if (activeModelName) {
    return client.getGenerativeModel({ model: activeModelName });
  }

  activeModelName = FALLBACK_MODELS[0];
  return client.getGenerativeModel({ model: activeModelName });
};

const getFallbackModelNames = () => FALLBACK_MODELS;

const setActiveGeminiModel = (modelName) => {
  activeModelName = modelName;
};

module.exports = {
  getGeminiClient,
  getGeminiModel,
  getFallbackModelNames,
  setActiveGeminiModel,
};
