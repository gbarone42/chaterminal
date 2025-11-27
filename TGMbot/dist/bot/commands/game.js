import gameManager from '../../game/manager.js';
import logger from '../../config/logger.js';
import { Markup } from 'telegraf';
export function registerGameCommands(bot) {
    // Comando START - Benvenuto
    bot.command('start', (ctx) => {
        const welcomeMsg = '🎭 *Benvenuto a UNDERCOVER!*\n\n' +
            '*Come si gioca:*\n' +
            '• Il gioco si svolge in un gruppo Telegram\n' +
            '• Ogni giocatore ha una chat privata con me\n' +
            '• Il superuser gestisce il flusso della partita\n\n' +
            '*Ruoli:*\n' +
            '👥 *Civili*: ricevono la stessa parola\n' +
            '🎭 *Undercover*: ricevono una parola simile\n' +
            '🎩 *Mr. White*: non riceve nessuna parola\n\n' +
            '*Comandi:*\n' +
            '/newgame - Crea una nuova partita (solo gruppo)\n' +
            '/join - Unisciti alla partita\n' +
            '/startgame - Avvia il gioco (solo superuser)\n' +
            '/endround - Termina round e avvia votazione (solo superuser)\n' +
            '/status - Mostra stato partita\n' +
            '/stop - Ferma la partita (solo superuser)\n' +
            '/help - Mostra questo messaggio';
        ctx.reply(welcomeMsg, { parse_mode: 'Markdown' });
    });
    // Comando HELP
    bot.command('help', (ctx) => {
        ctx.reply('📖 *Comandi disponibili:*\n\n' +
            '/newgame - Crea partita\n' +
            '/join - Unisciti\n' +
            '/startgame - Avvia gioco\n' +
            '/endround - Termina round\n' +
            '/status - Stato\n' +
            '/stop - Ferma partita', { parse_mode: 'Markdown' });
    });
    // NEWGAME - Crea nuova partita (solo in gruppo)
    bot.command('newgame', async (ctx) => {
        if (ctx.chat.type === 'private') {
            await ctx.reply('⚠️ Questo comando funziona solo nei gruppi!');
            return;
        }
        const groupChatId = ctx.chat.id;
        const superUserId = ctx.from.id;
        const existingSession = gameManager.getSession(groupChatId);
        if (existingSession && existingSession.phase !== 'ended') {
            await ctx.reply('⚠️ C\'è già una partita attiva! Usa /stop per terminarla.');
            return;
        }
        gameManager.createSession(groupChatId, superUserId);
        await ctx.reply('🎮 *Nuova partita Undercover creata!*\n\n' +
            '📝 *Istruzioni:*\n' +
            '1. Ogni giocatore deve scrivermi in privato /join\n' +
            '2. Quando tutti sono pronti, il superuser usa /startgame\n' +
            '3. Ogni giocatore riceverà ruolo e parola in privato\n\n' +
            `Superuser: ${ctx.from.first_name}`, { parse_mode: 'Markdown' });
    });
    // JOIN - Unisciti alla partita (in privato)
    bot.command('join', async (ctx) => {
        if (ctx.chat.type !== 'private') {
            await ctx.reply('⚠️ Usa /join in chat privata con me!');
            return;
        }
        // Chiedi il nome del giocatore se non ancora salvato
        const userId = ctx.from.id;
        const username = ctx.from.username || ctx.from.first_name;
        // Per semplicità, usiamo il nome Telegram
        // In una versione più complessa, potresti salvare nomi custom
        const name = ctx.from.first_name || username;
        // Nota: per JOIN in privato, dobbiamo trovare la sessione attiva
        // Opzione 1: Memorizzare groupChatId nel contesto utente (serve stato persistente)
        // Opzione 2: Chiedere all'utente di fornire un codice/link di invito
        // Per questo esempio, assumiamo che l'utente fornisca il groupChatId o che ci sia solo 1 sessione attiva
        // SEMPLIFICAZIONE: cerchiamo la prima sessione in fase waiting
        const targetSession = gameManager.findWaitingSession();
        if (!targetSession) {
            await ctx.reply('⚠️ Non ci sono partite in attesa di giocatori.\n\n' +
                'Chiedi al superuser di creare una partita con /newgame nel gruppo.');
            return;
        }
        const added = gameManager.addPlayer(targetSession.groupId, userId, username, name);
        if (added) {
            await ctx.reply(`✅ Ti sei unito alla partita come *${name}*!\n\nAttendi che il superuser avvii il gioco.`, {
                parse_mode: 'Markdown',
            });
            // Notifica nel gruppo
            await bot.telegram.sendMessage(targetSession.groupId, `✅ ${name} si è unito alla partita!\n\nGiocatori: ${targetSession.session.players.size}`);
        }
        else {
            await ctx.reply('⚠️ Sei già nella partita o la partita è già iniziata!');
        }
    });
    // STARTGAME - Avvia il gioco (solo superuser in gruppo)
    bot.command('startgame', async (ctx) => {
        if (ctx.chat.type === 'private') {
            await ctx.reply('⚠️ Questo comando funziona solo nei gruppi!');
            return;
        }
        const groupChatId = ctx.chat.id;
        const session = gameManager.getSession(groupChatId);
        if (!session) {
            await ctx.reply('⚠️ Nessuna partita attiva. Usa /newgame per crearne una.');
            return;
        }
        if (ctx.from.id !== session.superUserId) {
            await ctx.reply('⚠️ Solo il superuser può avviare il gioco!');
            return;
        }
        if (session.players.size < 3) {
            await ctx.reply('⚠️ Servono almeno 3 giocatori per iniziare!');
            return;
        }
        const started = gameManager.startGame(groupChatId);
        if (started) {
            const hasMrWhite = session.players.size >= 4;
            let gameInfo = `🎮 *Gioco avviato!*\n\n` +
                `👥 Giocatori: ${session.players.size}\n` +
                `🔄 Round: ${session.currentRound}\n`;
            if (hasMrWhite) {
                gameInfo += `🎩 Mr. White è in gioco!\n`;
            }
            else {
                gameInfo += `ℹ️ Servono 4+ giocatori per Mr. White\n`;
            }
            gameInfo += `\nOgni giocatore ha ricevuto ruolo e parola in privato.\n\n` +
                `*Fase discussione:* parlate e cercate di capire chi è chi!\n\n` +
                `Quando siete pronti, il superuser usa /endround per votare.`;
            await ctx.reply(gameInfo, { parse_mode: 'Markdown' });
            // Invia ruolo e parola a ciascun giocatore in privato
            for (const player of session.players.values()) {
                let message = `🎭 *Il gioco è iniziato!*\n\n`;
                message += `Tuo ruolo: *${getRoleEmoji(player.role)} ${getRoleName(player.role)}*\n`;
                if (player.role === 'mrwhite') {
                    message += `\n🎩 Sei Mr. White! Non hai ricevuto nessuna parola.\nDevi bluffare e cercare di capire quale sia la parola!`;
                }
                else {
                    message += `\nTua parola: *${player.word}*\n\n`;
                    if (player.role === 'civilian') {
                        message += `👥 Sei un Civile. Trova gli infiltrati!`;
                    }
                    else {
                        message += `🎭 Sei un Undercover. Confundi i civili senza farti scoprire!`;
                    }
                }
                try {
                    await bot.telegram.sendMessage(player.id, message, { parse_mode: 'Markdown' });
                }
                catch (error) {
                    logger.error({ playerId: player.id, error }, 'Impossibile inviare messaggio privato');
                }
            }
        }
        else {
            await ctx.reply('⚠️ Errore nell\'avviare il gioco.');
        }
    });
    // ENDROUND - Termina round e avvia votazione (solo superuser)
    bot.command('endround', async (ctx) => {
        if (ctx.chat.type === 'private') {
            await ctx.reply('⚠️ Questo comando funziona solo nei gruppi!');
            return;
        }
        const groupChatId = ctx.chat.id;
        const session = gameManager.getSession(groupChatId);
        if (!session) {
            await ctx.reply('⚠️ Nessuna partita attiva.');
            return;
        }
        if (ctx.from.id !== session.superUserId) {
            await ctx.reply('⚠️ Solo il superuser può terminare il round!');
            return;
        }
        if (session.phase !== 'playing') {
            await ctx.reply('⚠️ Non c\'è un round in corso!');
            return;
        }
        // Callback per il reminder di votazione
        const reminderCallback = async () => {
            const session = gameManager.getSession(groupChatId);
            if (!session)
                return;
            const notVotedPlayers = Array.from(session.players.values())
                .filter((p) => p.isAlive && !p.hasVoted);
            if (notVotedPlayers.length > 0) {
                const names = notVotedPlayers.map((p) => p.name).join(', ');
                await bot.telegram.sendMessage(groupChatId, `⏰ *Reminder votazione!*\n\nMancano ancora ${notVotedPlayers.length} voti.\nGiocatori che devono votare: ${names}`, { parse_mode: 'Markdown' });
            }
        };
        const votingStarted = gameManager.startVoting(groupChatId, reminderCallback);
        if (votingStarted) {
            await ctx.reply(`🗳️ *Fase di votazione!*\n\n` +
                `Ogni giocatore riceverà un messaggio privato per votare.\n` +
                `Scegliete chi eliminare!\n\n` +
                `⏰ Riceverete un reminder ogni 3 minuti se non tutti hanno votato.`, { parse_mode: 'Markdown' });
            // Invia pulsanti di votazione a ogni giocatore vivo
            const alivePlayers = gameManager.getAlivePlayers(groupChatId);
            for (const voter of alivePlayers) {
                const buttons = alivePlayers
                    .filter((p) => p.id !== voter.id) // Non puoi votare te stesso
                    .map((p) => {
                    const callbackData = `vote_${groupChatId}_${p.id}`;
                    logger.info({ callbackData, voterName: voter.name, targetName: p.name }, 'Creato pulsante voto');
                    return [Markup.button.callback(p.name, callbackData)];
                });
                try {
                    await bot.telegram.sendMessage(voter.id, `🗳️ *Votazione Round ${session.currentRound}*\n\nChi vuoi eliminare?`, {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
                    });
                    logger.info({ voterId: voter.id, voterName: voter.name }, 'Ballot inviato');
                }
                catch (error) {
                    logger.error({ playerId: voter.id, error }, 'Impossibile inviare ballot');
                }
            }
        }
    });
    // STATUS - Mostra stato partita
    bot.command('status', async (ctx) => {
        const groupChatId = ctx.chat.type === 'private' ? null : ctx.chat.id;
        if (!groupChatId) {
            await ctx.reply('⚠️ Questo comando funziona solo nei gruppi!');
            return;
        }
        const session = gameManager.getSession(groupChatId);
        if (!session) {
            await ctx.reply('⚠️ Nessuna partita attiva.');
            return;
        }
        const allPlayers = gameManager.getAllPlayers(groupChatId);
        const alivePlayers = allPlayers.filter((p) => p.isAlive);
        const deadPlayers = allPlayers.filter((p) => !p.isAlive);
        let statusMsg = `📊 *Stato Partita*\n\n`;
        statusMsg += `Fase: ${getPhaseEmoji(session.phase)} ${session.phase}\n`;
        statusMsg += `Round: ${session.currentRound}\n\n`;
        statusMsg += `👥 *Giocatori vivi (${alivePlayers.length}):*\n`;
        alivePlayers.forEach((p) => {
            statusMsg += `• ${p.name}\n`;
        });
        if (deadPlayers.length > 0) {
            statusMsg += `\n💀 *Eliminati (${deadPlayers.length}):*\n`;
            deadPlayers.forEach((p) => {
                statusMsg += `• ${p.name}\n`;
            });
        }
        await ctx.reply(statusMsg, { parse_mode: 'Markdown' });
    });
    // STOP - Ferma la partita (solo superuser)
    bot.command('stop', async (ctx) => {
        if (ctx.chat.type === 'private') {
            await ctx.reply('⚠️ Questo comando funziona solo nei gruppi!');
            return;
        }
        const groupChatId = ctx.chat.id;
        const session = gameManager.getSession(groupChatId);
        if (!session) {
            await ctx.reply('⚠️ Nessuna partita attiva.');
            return;
        }
        if (ctx.from.id !== session.superUserId) {
            await ctx.reply('⚠️ Solo il superuser può fermare la partita!');
            return;
        }
        gameManager.endGame(groupChatId);
        await ctx.reply('🛑 Partita terminata!');
    });
    // Handler per i pulsanti di votazione
    // Nota: il regex accetta numeri negativi per groupChatId (gruppi hanno ID negativi)
    bot.action(/^vote_(-?\d+)_(\d+)$/, async (ctx) => {
        try {
            const callbackData = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : 'unknown';
            logger.info({ callbackData }, 'Callback votazione ricevuto');
            const match = ctx.match;
            const groupChatId = parseInt(match[1]);
            const targetId = parseInt(match[2]);
            const voterId = ctx.from.id;
            logger.info({ groupChatId, targetId, voterId }, 'Parsing votazione');
            const session = gameManager.getSession(groupChatId);
            if (!session || session.phase !== 'voting') {
                await ctx.answerCbQuery('⚠️ Votazione non attiva!');
                return;
            }
            const voted = gameManager.registerVote(groupChatId, voterId, targetId);
            if (voted) {
                const target = session.players.get(targetId);
                await ctx.answerCbQuery(`✅ Hai votato ${target?.name}`);
                await ctx.editMessageText(`✅ Hai votato per eliminare *${target?.name}*`, { parse_mode: 'Markdown' });
                // Controlla se tutti hanno votato
                if (gameManager.allVoted(groupChatId)) {
                    // Conta i voti ed elimina
                    const result = gameManager.countVotesAndEliminate(groupChatId);
                    if (result) {
                        const eliminatedPlayer = session.players.get(result.targetId);
                        await bot.telegram.sendMessage(groupChatId, `🗳️ *Risultato votazione:*\n\n` +
                            `💀 *${result.targetName}* è stato eliminato con ${result.voteCount} voti!\n\n` +
                            `Ruolo: ${getRoleEmoji(eliminatedPlayer?.role)} ${getRoleName(eliminatedPlayer?.role)}\n` +
                            `Parola: ${eliminatedPlayer?.word || 'Nessuna (Mr. White)'}`, { parse_mode: 'Markdown' });
                        // Controlla condizione di vittoria
                        const winCondition = gameManager.checkWinCondition(groupChatId);
                        if (winCondition.hasWinner) {
                            await bot.telegram.sendMessage(groupChatId, `\n🏆 ${winCondition.message}`, { parse_mode: 'Markdown' });
                            gameManager.endGame(groupChatId);
                        }
                        else {
                            // Continua al prossimo round
                            await bot.telegram.sendMessage(groupChatId, `\n🔄 *Round ${session.currentRound}*\n\nDiscutete! Poi il superuser usa /endround per votare.`, { parse_mode: 'Markdown' });
                        }
                    }
                }
            }
            else {
                await ctx.answerCbQuery('⚠️ Non puoi votare ora!');
            }
        }
        catch (error) {
            logger.error({ error }, 'Errore handler votazione');
            await ctx.answerCbQuery('❌ Errore durante la votazione').catch(() => { });
        }
    });
}
// Utility functions
function getRoleEmoji(role) {
    switch (role) {
        case 'civilian':
            return '👥';
        case 'undercover':
            return '🎭';
        case 'mrwhite':
            return '🎩';
        default:
            return '❓';
    }
}
function getRoleName(role) {
    switch (role) {
        case 'civilian':
            return 'Civile';
        case 'undercover':
            return 'Undercover';
        case 'mrwhite':
            return 'Mr. White';
        default:
            return 'Sconosciuto';
    }
}
function getPhaseEmoji(phase) {
    switch (phase) {
        case 'waiting':
            return '⏳';
        case 'playing':
            return '🎮';
        case 'voting':
            return '🗳️';
        case 'ended':
            return '🏁';
        default:
            return '❓';
    }
}
