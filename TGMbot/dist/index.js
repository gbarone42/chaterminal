import { startBot } from './bot/index.js';
import logger from './config/logger.js';
process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled Rejection');
});
process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught Exception');
});
logger.info(`Avvio bot con token TELEGRAM_BOT_TOKEN_BOB`);
startBot();
