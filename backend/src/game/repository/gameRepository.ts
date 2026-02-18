import {
    NewGameData, PatchGameData,
    GameNormal, 
    GetAllGamesData,
} from "../types";
import prismaClient from "../../prismaClient";
import { Result } from "@badrap/result";
import { Prisma } from "@prisma/client";
import {
    getObjectWithSomeValuables, ConflictError,
    InternalError, NotFoundError, parseElo,
} from "../../utils";
import { selectPlayerLessClause } from "../../player/repository/playerRepository";
import { PatchPlayerData, PlayerNormal } from "../../player/types";
import { selectSpecialConfigurationNormalClause } from "../../specialGame/repository/specialGameRepository";

const selectBaseTimeStamps = {
    createdAt: true,
    editedAt: true,
    deletedAt: true,
}

export const selectGameNormalClause = {
    id: true,
    gameMode: true,
    matchType: true,
    timeControl: true,
    tcMinutes: true,
    tcBonus: true,
    gameStatus: true,
    gameResult: true,
    whiteEloBefore: true,
    whiteEloAfter: true,
    blackEloBefore: true,
    blackEloAfter: true,
    ...selectBaseTimeStamps,
    startedAt: true,
    finishedAt: true,
    whitePlayer: {
        select: selectPlayerLessClause,
    },
    blackPlayer: {
        select: selectPlayerLessClause,
    },
    pgn: true,
    tournamentId: true,
    tournamentRoundIndex: true,
    specialConfiguration: {
        select: selectSpecialConfigurationNormalClause,
    }
};

export const gameRepository = {
    //
    //Create new game.
    //
    async create(game: NewGameData): Promise<Result<GameNormal>> {
        try {
            const player1 = await prismaClient.player.findUniqueOrThrow({
                where: {
                    id: game.player1Id,
                    deletedAt: null,
                },
                select: selectPlayerLessClause,
            });
            const player2 = await prismaClient.player.findUniqueOrThrow({
                where: {
                    id: game.player2Id,
                    deletedAt: null,
                },
                select: selectPlayerLessClause,
            });

            let whitePlayerId: string;
            let blackPlayerId: string;

            if (game.whitePlayerId && game.blackPlayerId) {
                whitePlayerId = game.whitePlayerId;
                blackPlayerId = game.blackPlayerId;
            } else
            {
                const isPlayer1White = Math.random() < 0.5;
                whitePlayerId = isPlayer1White ? player1.id : player2.id;
                blackPlayerId = isPlayer1White ? player2.id : player1.id;
            }

            const whiteIsPlayer1 = whitePlayerId === player1.id;

            const estimatedTime = game.tcMinutes + (game.tcBonus * 40) / 60;
            const timeControl =
                estimatedTime < 3 ? "BULLET" :
                estimatedTime < 10 ? "BLITZ" :
                estimatedTime < 60 ? "RAPID" :
                "CLASSIC";

            const newGame = await prismaClient.game.create({
                data: {
                    gameMode: game.gameMode,
                    matchType: game.matchType,
                    timeControl,
                    tcMinutes: game.tcMinutes,
                    tcBonus: game.tcBonus,
                    gameStatus: game.gameStatus,
                    whitePlayer: { connect: { id: whitePlayerId } },
                    blackPlayer: { connect: { id: blackPlayerId } },
                    whiteEloBefore: parseElo(whiteIsPlayer1, game.gameMode, timeControl, player1 as PlayerNormal, player2 as PlayerNormal),
                    blackEloBefore: parseElo(!whiteIsPlayer1, game.gameMode, timeControl, player1 as PlayerNormal, player2 as PlayerNormal),
                    ...(game.tournamentId && { tournament: { connect: { id: game.tournamentId } } }),
                    tournamentRoundIndex: game.tournamentRoundIndex,
                    ...(game.specialConfigurationId && {
                        specialConfiguration: { connect: { id: game.specialConfigurationId } },
                    }),
                },
                select: selectGameNormalClause,
            });

            return Result.ok(newGame as GameNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new ConflictError());
            }
            return Result.err(new InternalError());
        }
    },

    //
    //Update existing game.
    //
    async patch(gameId: string, game: PatchGameData): Promise<Result<GameNormal>> {
        try {
            const gameData = {
                ...getObjectWithSomeValuables(game,
                    [ "gameStatus", "gameMode", "matchType", "gameResult", "whiteEloAfter",
                      "blackEloAfter", "startedAt", "finishedAt", "specialConfiguration",
                      "tcMinutes", "tcBonus"]),
                editedAt: new Date(),
            };

            const estimatedTime = (game.tcMinutes !== undefined && game.tcBonus !== undefined) 
                ? (game.tcMinutes + (game.tcBonus * 40) / 60)
                : 0;
            const timeControl =
                estimatedTime < 3 ? "BULLET" :
                estimatedTime < 10 ? "BLITZ" :
                estimatedTime < 60 ? "RAPID" :
                "CLASSIC";

            const updatedGame = await prismaClient.game.update({
                where: {
                    id: gameId,
                    deletedAt: null,
                },
                data: {
                    ...gameData,
                    ...(estimatedTime !== 0 && { timeControl }),
                    ...(game.tournamentRoundIndex && game.tournamentRoundIndex !== 0 && {
                        tournamentRoundIndex: game.tournamentRoundIndex,
                    }),
                    ...(game.pgn && { pgn: game.pgn }),
                },
                select: selectGameNormalClause,
            });

            return Result.ok(updatedGame as GameNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    //
    //Finish game and update both players in one transaction.
    //
    async finishGameWithPlayers(gameId: string, game: PatchGameData, whitePlayerId: string,
            whitePlayerPatch: PatchPlayerData, blackPlayerId: string, 
            blackPlayerPatch: PatchPlayerData): Promise<Result<GameNormal>> {
        try {
            const result = await prismaClient.$transaction(async (tx) => {
                const gameData = {
                    ...getObjectWithSomeValuables(game,
                        [ "gameStatus", "gameMode", "matchType", "gameResult", "whiteEloAfter",
                            "blackEloAfter", "startedAt", "finishedAt", "specialConfiguration",
                            "tcMinutes", "tcBonus"]),
                    editedAt: new Date(),
                };

                const estimatedTime = (game.tcMinutes !== undefined && game.tcBonus !== undefined) 
                    ? (game.tcMinutes + (game.tcBonus * 40) / 60)
                    : 0;
                const timeControl =
                    estimatedTime < 3 ? "BULLET" :
                    estimatedTime < 10 ? "BLITZ" :
                    estimatedTime < 60 ? "RAPID" :
                    "CLASSIC";

                const updatedGame = await tx.game.update({
                    where: {
                        id: gameId,
                        deletedAt: null,
                    },
                    data: {
                        ...gameData,
                        ...(estimatedTime !== 0 && { timeControl }),
                        ...(game.tournamentRoundIndex && game.tournamentRoundIndex !== 0 && {
                            tournamentRoundIndex: game.tournamentRoundIndex,
                        }),
                        ...(game.pgn && { pgn: game.pgn }),
                    },
                    select: selectGameNormalClause,
                });

                const whiteData = {
                    ...getObjectWithSomeValuables(whitePlayerPatch,
                        [ "nickname", "email", "eloRankedBlitz", "eloSpecialBlitz", "eloRankedBullet",
                        "eloSpecialBullet", "eloRankedRapid", "eloSpecialRapid", "eloRankedClassic",
                        "eloSpecialClassic", "eloRankedUnlimited", "eloSpecialUnlimited", "role" ]),
                    editedAt: new Date(),
                };

                await tx.player.update({
                    where: {
                        id: whitePlayerId,
                        deletedAt: null,
                    },
                    data: {
                        ...whiteData,
                        ongoingGameId: whitePlayerPatch.ongoingGameId,
                        ongoingTournamentId: whitePlayerPatch.ongoingTournamentId,
                        ongoingSpecialGameId: whitePlayerPatch.ongoingSpecialGameId,
                    },
                    select: selectPlayerLessClause,
                });

                const blackData = {
                    ...getObjectWithSomeValuables(blackPlayerPatch,
                        [ "nickname", "email", "eloRankedBlitz", "eloSpecialBlitz", "eloRankedBullet",
                        "eloSpecialBullet", "eloRankedRapid", "eloSpecialRapid", "eloRankedClassic",
                        "eloSpecialClassic", "eloRankedUnlimited", "eloSpecialUnlimited", "role" ]),
                    editedAt: new Date(),
                };

                await tx.player.update({
                    where: {
                        id: blackPlayerId,
                        deletedAt: null,
                    },
                    data: {
                        ...blackData,
                        ongoingGameId: blackPlayerPatch.ongoingGameId,
                        ongoingTournamentId: blackPlayerPatch.ongoingTournamentId,
                        ongoingSpecialGameId: blackPlayerPatch.ongoingSpecialGameId,
                    },
                    select: selectPlayerLessClause,
                });

                return updatedGame;
            });

            return Result.ok(result as GameNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === "P2025") {
                    return Result.err(new NotFoundError());
                }
            }
            return Result.err(new InternalError());
        }
    },

    //
    //Mark a selected game as deleted by setting the `deletedAt` property.
    //
    async delete(gameId: string): Promise<Result<GameNormal>> {
        try {
            const currentDate = new Date();

            const deletedGame = await prismaClient.game.update({
                where: {
                    id: gameId,
                    deletedAt: null,
                },
                data: {
                    editedAt: currentDate,
                    deletedAt: currentDate,
                },
                select: selectGameNormalClause,
            });

            return Result.ok(deletedGame as GameNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    //
    //Get a game by id
    //
    async getById(gameId: string): Promise<Result<GameNormal>> {
        try {
            const game = await prismaClient.game.findUniqueOrThrow({
                where: {
                    id: gameId,
                    deletedAt: null,
                },
                select: selectGameNormalClause,
            });

            return Result.ok(game as GameNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    //
    // Get all games (can filter by parameters in requestQuery)
    //
    async getAllPaged(requestQuery: GetAllGamesData)
    : Promise<Result<{ games: GameNormal[], totalCount: number }>> {

        const { page, pagesize: pageSize, keyword, start, end, gameMode, 
                matchType, timeControl, gameStatus, tcMinutes, tcBonus } = requestQuery;
        
        const whereClause: any = {
            AND: [{
                deletedAt: null,
            }]
        };

        if (gameMode) {
            whereClause.AND.push({ gameMode });
        }
        if (matchType) {
            whereClause.AND.push({ matchType });
        }
        if (timeControl) {
            whereClause.AND.push({ timeControl });
        }
        if (tcMinutes) {
            whereClause.AND.push({ tcMinutes });
        }
        if (tcBonus) {
            whereClause.AND.push({ tcBonus });
        }
        if (gameStatus) {
            whereClause.AND.push({ gameStatus });
        }
        if (start) {
            whereClause.AND.push({
                createdAt: { gte: new Date(start) }
            });
        }
        if (end) {
            whereClause.AND.push({
                finishedAt: { lte: new Date(end) }
            });
        }
        if (keyword) {
            whereClause.AND.push({
                OR: [
                    { whitePlayer: { nickname: { contains: keyword, mode: "insensitive" } } },
                    { blackPlayer: { nickname: { contains: keyword, mode: "insensitive" } } },
                ],
            });
        }

        const query = {
            where: whereClause,
            orderBy: { finishedAt: 'desc' },
            ...(page != null && {
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
            select: selectGameNormalClause,
        } satisfies Prisma.GameFindManyArgs;

        try {
            const [games, totalCount] = await prismaClient.$transaction([
                prismaClient.game.findMany(query),
                prismaClient.game.count({ where: whereClause }),
            ]);
        
            if (games.length === 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }
        
            return Result.ok({ games: games as GameNormal[], totalCount });
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },
}
