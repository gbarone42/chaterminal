import dotenv from 'dotenv';
dotenv.config();
import logger from './logger.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_BOB;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN_BOB mancante. Inserisci il token nel file .env');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  logger.warn('OPENAI_API_KEY mancante. Le risposte AI saranno statiche.');
}

export { BOT_TOKEN, OPENAI_API_KEY };
