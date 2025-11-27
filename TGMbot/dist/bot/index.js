import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from '../config/env.js';
import logger from '../config/logger.js';
import { registerGameCommands } from './commands/game.js';
let bot = null;
export function startBot() {
    if (bot)
        return bot;
    bot = new Telegraf(BOT_TOKEN);
    // Registra tutti i comandi del gioco Undercover
    registerGameCommands(bot);
    bot.catch((err) => logger.error({ err }, 'Errore Telegraf'));
    bot.launch();
    logger.info('🎭 Undercover Bot avviato!');
    return bot;
}
