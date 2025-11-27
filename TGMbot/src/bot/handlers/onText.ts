import { Context } from 'telegraf';
import logger from '../../config/logger.js';
import { generateReply } from '../openai.js';

export async function onTextHandler(ctx: Context) {
  // Type guard: assicurarsi che il messaggio abbia la proprietà `text`
  let text = '';
  if (ctx.message && 'text' in ctx.message && typeof ctx.message.text === 'string') {
    text = ctx.message.text.toLowerCase();
  }

  if (text.includes('ciao') || text.includes('hello')) {
    ctx.reply('Ciao! Come posso aiutarti oggi?');
    return;
  }

  logger.info({ input: text }, 'Ricevuto messaggio utente');
  const reply = await generateReply(text);
  logger.info({ output: reply }, 'Risposta generata');
  ctx.reply(reply);
}
