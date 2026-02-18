import {
    NewPlayerData, PatchPlayerData, PlayerNormal, PlayerStats, GetPlayerGamesData,
    PlayerLess, GetPlayerTournamentsData, GetPlayerSavedConfigurationsData,
    GetPlayerSpecialGamesData,
} from "../types";
import prismaClient from "../../prismaClient";
import { Result } from "@badrap/result";
import {
    Prisma, GameResult
} from "@prisma/client";
import {
    getObjectWithSomeValuables, ConflictError,
    InternalError, NotFoundError,
    filterBlackPlayerByNickname,
    filterWhitePlayerByNickname,
} from "../../utils";
import z from "zod";
import { GameResultWinLoseDrawSchema, getMultipleModelsSchema } from "../../generalValidationSchemas";
import { selectGameNormalClause } from "../../game/repository/gameRepository";
import { PlayerTournamentWithResult, TournamentNormal } from "../../tournament/types";
import { GameNormal } from "../../game/types";
import { selectSpecialConfigurationNormalClause } from "../../specialGame/repository/specialGameRepository";
import { PlayerSpecialGameWithResult, SpecialConfigurationNormal, SpecialGameNormal } from "../../specialGame/types";


export const selectPlayerLessClause = {
    id: true,
    nickname: true,
    eloRankedBlitz: true,
    eloSpecialBlitz: true,
    eloRankedBullet: true,
    eloSpecialBullet: true,
    eloRankedRapid: true,
    eloSpecialRapid: true,
    eloRankedClassic: true,
    eloSpecialClassic: true,
    eloRankedUnlimited: true,
    eloSpecialUnlimited: true,
    ongoingGameId: true,
    ongoingTournamentId: true,
    ongoingSpecialGameId: true,
    createdAt: true,
    editedAt: true,
    deletedAt: true,
}

export const selectPlayerNormalClause = {
    email: true,
    role: true,
    ...selectPlayerLessClause,
};

export const selectPlayerGamesClause = {
    whiteGames: true,
    blackGames: true,
};

export const playerRepository = {
    /*
    * Create new player.
    */
    async create(player: NewPlayerData): Promise<Result<PlayerNormal>> {
        try {
            const newPlayer = await prismaClient.player.create({
                data: {
                    nickname: player.nickname,
                    email: player.email,
                    eloRankedBlitz: player.eloRankedBlitz,
                    eloSpecialBlitz: player.eloSpecialBlitz,
                    eloRankedBullet: player.eloRankedBullet,
                    eloSpecialBullet: player.eloSpecialBullet,
                    eloRankedRapid: player.eloRankedRapid,
                    eloSpecialRapid: player.eloSpecialRapid,
                    eloRankedClassic: player.eloRankedClassic,
                    eloSpecialClassic: player.eloSpecialClassic,
                    eloRankedUnlimited: player.eloRankedUnlimited,
                    eloSpecialUnlimited: player.eloSpecialUnlimited,
                    role: player.role,
                },
                select: selectPlayerLessClause,
            });

            return Result.ok(newPlayer as PlayerNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new ConflictError('Player with this email or nickname already exists.'));
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Update existing player.
    */
    async patch(playerId: string, player: PatchPlayerData): Promise<Result<PlayerNormal>> {
        try {
            const playerData = {
                ...getObjectWithSomeValuables(player,
                    [ "nickname", "email", "eloRankedBlitz", "eloSpecialBlitz", "eloRankedBullet",
                      "eloSpecialBullet", "eloRankedRapid", "eloSpecialRapid", "eloRankedClassic",
                      "eloSpecialClassic", "eloRankedUnlimited", "eloSpecialUnlimited", "role"]),
                editedAt: new Date(),
            }

            const updatedPlayer = await prismaClient.player.update({
                where: {
                    id: playerId,
                    deletedAt: null,
                },
                data: {
                    ...playerData,
                    ongoingGameId: player.ongoingGameId,
                    ongoingTournamentId: player.ongoingTournamentId,
                    ongoingSpecialGameId: player.ongoingSpecialGameId,
                },
                select: selectPlayerLessClause,
            });

            return Result.ok(updatedPlayer as PlayerNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2002') {
                    return Result.err(new ConflictError('Player with this email or nickname already exists.'));
                }
                if (e.code === 'P2025') {
                    return Result.err(new NotFoundError());
                }
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Mark a selected player as deleted by setting the `deletedAt` property.
    */
    async delete(playerId: string): Promise<Result<PlayerNormal>> {
        try {
            const currentDate = new Date();

            const player = await prismaClient.player.findUniqueOrThrow({
                where: {
                    id: playerId,
                    deletedAt: null,
                },
                select: selectPlayerNormalClause,
            });

            const deletedPlayer = await prismaClient.player.update({
                where: {
                    id: playerId,
                    deletedAt: null,
                },
                data: {
                    editedAt: currentDate,
                    deletedAt: currentDate,
                    email: player.email.concat(" (player with id '", playerId, "' deleted)"),
                },
                select: selectPlayerLessClause,
            });

            return Result.ok(deletedPlayer as PlayerNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Collect game statistics related to a player.
    */
    async getPlayerGameStatistics(playerId: string): Promise<Result<PlayerStats>> {
        try {
            const gameStatistics = await prismaClient.$transaction(
                async (tx) => {
                    const victoryCount = await tx.game.count({
                        where: {
                            OR: [
                                {
                                    blackPlayerId: playerId,
                                    gameResult: GameResult.BLACK,
                                },
                                {
                                    whitePlayerId: playerId,
                                    gameResult: GameResult.WHITE,
                                },
                            ],
                        },
                    });

                    const lossCount = await tx.game.count({
                        where: {
                            OR: [
                                {
                                    blackPlayerId: playerId,
                                    gameResult: GameResult.WHITE,
                                },
                                {
                                    whitePlayerId: playerId,
                                    gameResult: GameResult.BLACK,
                                },
                            ],
                        },
                    });

                    const drawCount = await tx.game.count({
                        where: {
                            OR: [
                                {
                                    blackPlayerId: playerId,
                                    gameResult: GameResult.DRAW,
                                },
                                {
                                    whitePlayerId: playerId,
                                    gameResult: GameResult.DRAW,
                                },
                            ],
                        },
                    });

                    return { victoryCount, lossCount, drawCount };
            });

            return Result.ok(gameStatistics);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get a player by email
    */
    async getByEmail(email: string): Promise<Result<PlayerNormal>> {
        try {
            const player = await prismaClient.player.findUniqueOrThrow({
                where: {
                    email: email,
                    deletedAt: null,
                },
                select: selectPlayerLessClause,
            });

            return Result.ok(player as PlayerNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get a player by id
    */
    async getById(playerId: string): Promise<Result<PlayerNormal>> {
        try {
            const player = await prismaClient.player.findUniqueOrThrow({
                where: {
                    id: playerId,
                    deletedAt: null,
                },
                select: selectPlayerLessClause,
            });

            return Result.ok(player as PlayerNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get all players with less detailed information (paginated).
    */
    async getAllPagedLess(requestQuery: z.infer<typeof getMultipleModelsSchema.shape.query>)
    : Promise<Result<{ players: PlayerLess[], totalCount: number }>> {
        
        const { page, pagesize: pageSize, keyword } = requestQuery;
        const whereClause = {
            deletedAt: null,
            ...(keyword && {
                nickname: {
                    contains: keyword,
                    mode: Prisma.QueryMode.insensitive
                },
            }),
        };

        const query = {
            where: whereClause,
            ...(page != null && {
                orderBy: [
                    { nickname: 'asc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            select: selectPlayerLessClause,
        } satisfies Prisma.PlayerFindManyArgs;

        try {
            const [ players, totalCount ] = await prismaClient.$transaction([
                prismaClient.player.findMany(query),
                prismaClient.player.count({ where: whereClause }),
            ]);

            if (players.length == 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            return Result.ok({ players: players as PlayerLess[], totalCount });
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get all players with normal detailed information (paginated).
    */
    async getAllPagedNormal(requestQuery: z.infer<typeof getMultipleModelsSchema.shape.query>)
    : Promise<Result<{ players: PlayerNormal[], totalCount: number }>> {
        
        const { page, pagesize: pageSize, keyword } = requestQuery;
        const whereClause = {
            deletedAt: null,
            ...(keyword && {
                nickname: {
                    contains: keyword,
                    mode: Prisma.QueryMode.insensitive
                },
            }),
        };

        const query = {
            where: whereClause,
            ...(page != null && {
                orderBy: [
                    { nickname: 'asc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            select: selectPlayerNormalClause,
        } satisfies Prisma.PlayerFindManyArgs;

        try {
            const [ players, totalCount ] = await prismaClient.$transaction([
                prismaClient.player.findMany(query),
                prismaClient.player.count({ where: whereClause }),
            ]);

            if (players.length == 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            return Result.ok({ players: players as PlayerNormal[], totalCount });
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get games that a player (found by id) took a part in
    */
    async getPlayerGames( playerId: string, requestQuery: GetPlayerGamesData)
    : Promise<Result<{ games: GameNormal[]; totalCount: number }>> {
        const { page, pagesize: pageSize, keyword, result } = requestQuery;

        const whereClause =
            (result == GameResultWinLoseDrawSchema.Values.WIN)
            ? 
            { OR: [
                {
                    whitePlayerId: playerId,
                    gameResult: GameResult.WHITE,
                    ...(keyword ? filterBlackPlayerByNickname(keyword) : []),
                },
                {
                    blackPlayerId: playerId,
                    gameResult: GameResult.BLACK,
                    ...(keyword ? filterWhitePlayerByNickname(keyword) : []),
                },
            ]}
            : (result == GameResultWinLoseDrawSchema.Values.LOSE)
                ?
                { OR: [
                    {
                        whitePlayerId: playerId,
                        gameResult: GameResult.BLACK,
                        ...(keyword ? filterBlackPlayerByNickname(keyword) : []),
                    },
                    {
                        blackPlayerId: playerId,
                        gameResult: GameResult.WHITE,
                        ...(keyword ? filterWhitePlayerByNickname(keyword) : []),
                    },
                ]}
                : (result == GameResultWinLoseDrawSchema.Values.DRAW)
                    ?
                    { OR: [
                        {
                            whitePlayerId: playerId,
                            gameResult: GameResult.DRAW,
                            ...(keyword ? filterBlackPlayerByNickname(keyword) : []),
                        },
                        {
                            blackPlayerId: playerId,
                            gameResult: GameResult.DRAW,
                            ...(keyword ? filterWhitePlayerByNickname(keyword) : []),
                        },
                    ]}
                    : { OR: [
                        {
                            whitePlayerId: playerId,
                            ...(keyword ? filterBlackPlayerByNickname(keyword) : []),
                        },
                        {
                            blackPlayerId: playerId,
                            ...(keyword ? filterWhitePlayerByNickname(keyword) : []),
                        }
                    ]};

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
            console.log(e)
            if (e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get tournaments that a player (found by id) took a part in
    */
    async getPlayerTournaments( playerId: string, requestQuery: GetPlayerTournamentsData)
    : Promise<Result<{ tournaments: PlayerTournamentWithResult[]; totalCount: number }>> {
        const { page, pagesize: pageSize, keyword } = requestQuery;

        const whereClause = {
            finishedAt: {
                not: null,
            },
            deletedAt: null,
            players: {
                some: {
                    id: playerId,
                },
            },
        };

        const query = {
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            ...(page != null && {
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
            include: {
                tournamentResults: {
                    where: {
                        playerId,
                    },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        resultIndex: true,
                    },
                },
                owner: true,
                winner: true,
            },
        } satisfies Prisma.TournamentFindManyArgs;

        try {
            const [rawTournaments, totalCount] = await prismaClient.$transaction([
                prismaClient.tournament.findMany(query),
                prismaClient.tournament.count({ where: whereClause }),
            ]);

            if (rawTournaments.length === 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            const tournaments: PlayerTournamentWithResult[] = rawTournaments.map((t) => {
                const resultIndex = t.tournamentResults[0]?.resultIndex ?? null;
                const { tournamentResults, ...rest } = t;

                return {
                    ...(rest as TournamentNormal),
                    playerResultIndex: resultIndex,
                };
            });
        
            return Result.ok({ tournaments: tournaments as PlayerTournamentWithResult[], totalCount });
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get special games that a player (found by id) took a part in
    */
    async getPlayerSpecialGames( playerId: string, requestQuery: GetPlayerSpecialGamesData)
    : Promise<Result<{ specialGames: PlayerSpecialGameWithResult[]; totalCount: number }>> {
        const { page, pagesize: pageSize, keyword } = requestQuery;

        const whereClause = {
            finishedAt: {
                not: null,
            },
            deletedAt: null,
            players: {
                some: {
                    id: playerId,
                },
            },
        };

        const query = {
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            ...(page != null && {
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
            include: {
                specialGameResults: {
                    where: {
                        playerId,
                    },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        resultIndex: true,
                    },
                },
                owner: true,
                winner: true,
                specialConfiguration: true,
            },
        } satisfies Prisma.SpecialGameFindManyArgs;

        try {
            const [rawSpecialGames, totalCount] = await prismaClient.$transaction([
                prismaClient.specialGame.findMany(query),
                prismaClient.specialGame.count({ where: whereClause }),
            ]);

            if (rawSpecialGames.length === 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            const specialGames: PlayerSpecialGameWithResult[] = rawSpecialGames.map((sg) => {
                const resultIndex = sg.specialGameResults[0]?.resultIndex ?? null;
                const { specialGameResults, ...rest } = sg;

                return {
                    ...(rest as SpecialGameNormal),
                    playerResultIndex: resultIndex,
                };
            });

            return Result.ok({ specialGames: specialGames as PlayerSpecialGameWithResult[], totalCount });
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Player saves new special configuration
    */
    async saveConfiguration(playerId: string, specialConfigurationId: string): Promise<Result<undefined>> {
        try {
            await prismaClient.player.update({
                where: {
                    id: playerId,
                    deletedAt: null,
                },
                data: {
                    savedConfigurations: {
                        connect: { id: specialConfigurationId },
                    }
                },
                select: selectPlayerLessClause,
            });

            return Result.ok(undefined);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2025') {
                    return Result.err(new NotFoundError());
                }
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Get saved special configurations that a player (found by id) has saved
    */
    async getPlayerSavedConfigurations( playerId: string, requestQuery: GetPlayerSavedConfigurationsData)
    : Promise<Result<{ specialConfigurations: SpecialConfigurationNormal[]; totalCount: number }>> {
        const { page, pagesize: pageSize, keyword } = requestQuery;

        const whereClause = {
            savedBy: {
                some: {
                    id: playerId,
                },
            },
        };

        const query = {
            where: whereClause,
            ...(page != null && {
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
            select: selectSpecialConfigurationNormalClause,
        } satisfies Prisma.SpecialConfigurationFindManyArgs;

        try {
            const [specialConfigurations, totalCount] = await prismaClient.$transaction([
                prismaClient.specialConfiguration.findMany(query),
                prismaClient.specialConfiguration.count({ where: whereClause }),
            ]);

            if (specialConfigurations.length === 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }
        
            return Result.ok({
                specialConfigurations: specialConfigurations as SpecialConfigurationNormal[],
                totalCount
            });
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2025') {
                return Result.err(new NotFoundError());
            }
            return Result.err(new InternalError());
        }
    },
};
