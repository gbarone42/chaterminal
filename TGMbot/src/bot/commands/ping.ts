import { Context } from 'telegraf';

export function pingCommand(ctx: Context) {
  ctx.reply(`pong! 🏓 ${new Date().toISOString()}`);
}
