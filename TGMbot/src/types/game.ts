export type Role = 'civilian' | 'undercover' | 'mrwhite';
export type GamePhase = 'waiting' | 'playing' | 'voting' | 'ended';

export interface Player {
  id: number;
  username: string;
  name: string;
  role?: Role;
  word?: string;
  isAlive: boolean;
  hasVoted: boolean;
}

export interface GameSession {
  id: string;
  groupChatId: number;
  superUserId: number;
  players: Map<number, Player>; // userId -> Player
  phase: GamePhase;
  currentRound: number;
  votes: Map<number, number>; // voterId -> targetId
  wordPair?: { civilian: string; undercover: string };
  createdAt: Date;
  voteTimerId?: NodeJS.Timeout; // Timer per reminder votazione
}

export interface VoteResult {
  targetId: number;
  targetName: string;
  voteCount: number;
}

export interface WinCondition {
  hasWinner: boolean;
  winner?: 'civilians' | 'undercovers' | 'mrwhite';
  message?: string;
}
