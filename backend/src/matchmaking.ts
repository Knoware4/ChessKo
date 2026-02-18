import { GameMode, MatchType, TimeControl } from "@prisma/client";
import { GameSocket } from "./sockets/socketHandlers";


export type SearchGameRequest = {
    socket: GameSocket;
    playerId: string;
    elo: number;
    gameMode: GameMode;
    matchType: MatchType;
    timeControl: TimeControl;
    tcMinutes: number;
    tcBonus: number;
};

const matchmakingQueue: SearchGameRequest[] = [];

export const addToQueue = (request: SearchGameRequest): boolean => {
  const inQueue = matchmakingQueue.find((p) => p.playerId === request.playerId) !== undefined;
  if (inQueue) {
    return false;
  }

  matchmakingQueue.push(request);
  return true;
};

export const removeFromQueueBySocket = (socketId: string) => {
  const index = matchmakingQueue.findIndex((p) => p.socket.id === socketId);
  if (index !== -1) {
    return matchmakingQueue.splice(index, 1)[0];
  }
  return null;
};

export const findOpponent = (request: SearchGameRequest): SearchGameRequest | null => {
  const opponentIndex = matchmakingQueue.findIndex(
    (p) =>
      p.playerId !== request.playerId &&
      p.gameMode === request.gameMode &&
      p.matchType === request.matchType &&
      p.timeControl === request.timeControl &&
      p.tcMinutes === request.tcMinutes &&
      p.tcBonus === request.tcBonus &&
      Math.abs(p.elo - request.elo) <= 200
  );

  if (opponentIndex !== -1) {
    return matchmakingQueue.splice(opponentIndex, 1)[0];
  }
  return null;
};
