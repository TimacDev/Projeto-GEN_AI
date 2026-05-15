import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    geminiApiKey: process.env.GEMINI_API_KEY,
};
