import { Context } from 'telegraf';

export function startCommand(ctx: Context) {
  ctx.reply('Ciao! Sono Bob, il tuo assistente Telegram. Scrivi /help per scoprire cosa posso fare.');
}
