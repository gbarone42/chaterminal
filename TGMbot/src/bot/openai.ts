
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config/env.js';
import logger from '../config/logger.js';

let openai: OpenAI | null = null;
if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

export async function generateReply(userMessage: string): Promise<string> {
  if (!openai) {
    logger.warn('OPENAI_API_KEY non configurata, risposta statica.');
    return 'Ciao! Sono un bot, ma non posso rispondere in modo intelligente al momento.';
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Rispondi come un assistente Telegram amichevole.' },
        { role: 'user', content: userMessage }
      ]
    });
    return completion.choices[0]?.message?.content?.trim() || 'Risposta non disponibile.';
  } catch (err) {
    logger.error({ err }, 'Errore chiamata OpenAI');
    return 'Si è verificato un errore nel generare la risposta.';
  }
}
