import { getRandomWordPair } from './words.js';
import logger from '../config/logger.js';
class GameManager {
    constructor() {
        this.sessions = new Map(); // groupChatId -> GameSession
    }
    // Crea una nuova sessione di gioco
    createSession(groupChatId, superUserId) {
        const session = {
            id: `game_${Date.now()}`,
            groupChatId,
            superUserId,
            players: new Map(),
            phase: 'waiting',
            currentRound: 0,
            votes: new Map(),
            createdAt: new Date(),
        };
        this.sessions.set(groupChatId, session);
        logger.info({ sessionId: session.id, groupChatId }, 'Nuova sessione Undercover creata');
        return session;
    }
    // Ottieni sessione per gruppo
    getSession(groupChatId) {
        return this.sessions.get(groupChatId);
    }
    // Aggiungi giocatore alla sessione
    addPlayer(groupChatId, userId, username, name) {
        const session = this.getSession(groupChatId);
        if (!session || session.phase !== 'waiting') {
            return false;
        }
        if (session.players.has(userId)) {
            return false; // Già registrato
        }
        const player = {
            id: userId,
            username,
            name,
            isAlive: true,
            hasVoted: false,
        };
        session.players.set(userId, player);
        logger.info({ userId, name }, 'Giocatore aggiunto alla sessione');
        return true;
    }
    // Assegna ruoli e parole ai giocatori
    startGame(groupChatId) {
        const session = this.getSession(groupChatId);
        if (!session || session.phase !== 'waiting') {
            return false;
        }
        const playerCount = session.players.size;
        if (playerCount < 3) {
            return false; // Minimo 3 giocatori
        }
        // Determina numero di undercover (circa 1/3 dei giocatori, almeno 1)
        const undercoverCount = Math.max(1, Math.floor(playerCount / 3));
        // Mr. White è presente solo con 4+ giocatori
        const hasMrWhite = playerCount >= 4;
        // Shuffle players
        const playerIds = Array.from(session.players.keys());
        this.shuffleArray(playerIds);
        // Assegna ruoli
        const wordPair = getRandomWordPair();
        session.wordPair = wordPair;
        let startIndex = 0;
        // Mr. White (1 solo, solo se 4+ giocatori)
        if (hasMrWhite) {
            const mrWhiteId = playerIds[0];
            const mrWhite = session.players.get(mrWhiteId);
            mrWhite.role = 'mrwhite';
            mrWhite.word = undefined; // Mr. White non ha parola
            startIndex = 1;
        }
        // Undercover
        for (let i = startIndex; i < startIndex + undercoverCount; i++) {
            const player = session.players.get(playerIds[i]);
            player.role = 'undercover';
            player.word = wordPair.undercover;
        }
        // Civilians (resto)
        for (let i = startIndex + undercoverCount; i < playerIds.length; i++) {
            const player = session.players.get(playerIds[i]);
            player.role = 'civilian';
            player.word = wordPair.civilian;
        }
        session.phase = 'playing';
        session.currentRound = 1;
        logger.info({
            sessionId: session.id,
            players: playerCount,
            undercovers: undercoverCount,
            hasMrWhite,
            civilianWord: wordPair.civilian,
            undercoverWord: wordPair.undercover,
        }, 'Gioco avviato, ruoli assegnati');
        return true;
    }
    // Inizia fase di votazione
    startVoting(groupChatId, reminderCallback) {
        const session = this.getSession(groupChatId);
        if (!session || session.phase !== 'playing') {
            return false;
        }
        session.phase = 'voting';
        session.votes.clear();
        // Reset hasVoted per giocatori vivi
        session.players.forEach((player) => {
            if (player.isAlive) {
                player.hasVoted = false;
            }
        });
        // Imposta timer per reminder ogni 3 minuti
        if (reminderCallback) {
            session.voteTimerId = setInterval(() => {
                if (session.phase === 'voting' && !this.allVoted(groupChatId)) {
                    reminderCallback();
                }
            }, 3 * 60 * 1000); // 3 minuti
        }
        logger.info({ sessionId: session.id, round: session.currentRound }, 'Votazione iniziata');
        return true;
    }
    // Ferma il timer di votazione
    stopVoteTimer(groupChatId) {
        const session = this.getSession(groupChatId);
        if (session && session.voteTimerId) {
            clearInterval(session.voteTimerId);
            session.voteTimerId = undefined;
            logger.info({ sessionId: session.id }, 'Timer votazione fermato');
        }
    }
    // Registra voto di un giocatore
    registerVote(groupChatId, voterId, targetId) {
        const session = this.getSession(groupChatId);
        if (!session || session.phase !== 'voting') {
            return false;
        }
        const voter = session.players.get(voterId);
        const target = session.players.get(targetId);
        if (!voter || !target || !voter.isAlive || !target.isAlive || voter.hasVoted) {
            return false;
        }
        session.votes.set(voterId, targetId);
        voter.hasVoted = true;
        logger.info({ voterId, targetId }, 'Voto registrato');
        return true;
    }
    // Verifica se tutti hanno votato
    allVoted(groupChatId) {
        const session = this.getSession(groupChatId);
        if (!session)
            return false;
        const alivePlayers = Array.from(session.players.values()).filter((p) => p.isAlive);
        return alivePlayers.every((p) => p.hasVoted);
    }
    // Conta voti ed elimina il più votato
    countVotesAndEliminate(groupChatId) {
        const session = this.getSession(groupChatId);
        if (!session || session.phase !== 'voting') {
            return null;
        }
        // Ferma il timer di votazione
        this.stopVoteTimer(groupChatId);
        const voteCounts = new Map();
        // Conta voti
        session.votes.forEach((targetId) => {
            voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
        });
        if (voteCounts.size === 0) {
            return null;
        }
        // Trova il più votato
        let maxVotes = 0;
        let eliminatedId = 0;
        voteCounts.forEach((count, playerId) => {
            if (count > maxVotes) {
                maxVotes = count;
                eliminatedId = playerId;
            }
        });
        const eliminatedPlayer = session.players.get(eliminatedId);
        if (eliminatedPlayer) {
            eliminatedPlayer.isAlive = false;
            logger.info({ playerId: eliminatedId, name: eliminatedPlayer.name, role: eliminatedPlayer.role }, 'Giocatore eliminato');
        }
        session.phase = 'playing';
        session.currentRound++;
        return {
            targetId: eliminatedId,
            targetName: eliminatedPlayer?.name || 'Sconosciuto',
            voteCount: maxVotes,
        };
    }
    // Controlla condizione di vittoria
    checkWinCondition(groupChatId) {
        const session = this.getSession(groupChatId);
        if (!session) {
            return { hasWinner: false };
        }
        const alivePlayers = Array.from(session.players.values()).filter((p) => p.isAlive);
        const aliveCivilians = alivePlayers.filter((p) => p.role === 'civilian');
        const aliveUndercovers = alivePlayers.filter((p) => p.role === 'undercover');
        const aliveMrWhite = alivePlayers.filter((p) => p.role === 'mrwhite');
        // Se tutti i civili sono eliminati -> vincono undercover
        if (aliveCivilians.length === 0) {
            return {
                hasWinner: true,
                winner: 'undercovers',
                message: '🎭 Gli Undercover hanno vinto! Tutti i civili sono stati eliminati!',
            };
        }
        // Se tutti gli undercover sono eliminati E Mr. White è eliminato -> vincono civili
        if (aliveUndercovers.length === 0 && aliveMrWhite.length === 0) {
            return {
                hasWinner: true,
                winner: 'civilians',
                message: '👥 I Civili hanno vinto! Tutti gli infiltrati sono stati scoperti!',
            };
        }
        // Se solo Mr. White è rimasto (con o senza civili) -> vince Mr. White
        if (aliveUndercovers.length === 0 && aliveMrWhite.length > 0 && aliveCivilians.length <= 2) {
            return {
                hasWinner: true,
                winner: 'mrwhite',
                message: '🎩 Mr. White ha vinto! È riuscito a ingannare tutti!',
            };
        }
        return { hasWinner: false };
    }
    // Termina il gioco
    endGame(groupChatId) {
        const session = this.getSession(groupChatId);
        if (session) {
            // Ferma eventuali timer attivi
            this.stopVoteTimer(groupChatId);
            session.phase = 'ended';
            this.sessions.delete(groupChatId);
            logger.info({ sessionId: session.id }, 'Gioco terminato manualmente');
        }
    }
    // Ottieni giocatori vivi
    getAlivePlayers(groupChatId) {
        const session = this.getSession(groupChatId);
        if (!session)
            return [];
        return Array.from(session.players.values()).filter((p) => p.isAlive);
    }
    // Ottieni tutti i giocatori
    getAllPlayers(groupChatId) {
        const session = this.getSession(groupChatId);
        if (!session)
            return [];
        return Array.from(session.players.values());
    }
    // Trova la prima sessione in fase waiting (per JOIN)
    findWaitingSession() {
        for (const [groupId, session] of this.sessions.entries()) {
            if (session.phase === 'waiting') {
                return { groupId, session };
            }
        }
        return null;
    }
    // Shuffle array (Fisher-Yates)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
export default new GameManager();
