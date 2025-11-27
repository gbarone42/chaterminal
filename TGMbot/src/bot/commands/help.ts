import { Context } from 'telegraf';

export function helpCommand(ctx: Context) {
  ctx.reply('Comandi disponibili:\n/start - Benvenuto\n/help - Questo messaggio\n/ping - Test di risposta');
}
