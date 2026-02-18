import prismaClient from "../../prismaClient";
import { Result } from "@badrap/result";
import { Prisma, UpgradeKey } from "@prisma/client";
import {
    getObjectWithSomeValuables, ConflictError,
    InternalError, NotFoundError,
} from "../../utils";
import z from "zod";
import { GetSpecialGameGamesData, GetSpecialGameLeaderboardData, GetSpecialGamePlayersData,
    NewSpecialGameData, PatchSpecialGameData, SpecialConfigurationNormal, SpecialGameNormal, SpecialGameResult } from "../types";
import { getAllSpecialGamesRequestSchema } from "../validationSchemas/RESTValidationSchemas";
import { GameNormal } from "../../game/types";
import { selectGameNormalClause } from "../../game/repository/gameRepository";
import { PlayerNormal } from "../../player/types";
import { selectPlayerNormalClause } from "../../player/repository/playerRepository";
import { SpecialChessEngine } from "../../engine/SpecialChessEngine";
import { SpecialGameLeaderboardDbEntry } from "../../engine/special/types";


export const selectSpecialConfigurationNormalClause = {
    id: true,
    name: true,
    variantKey: true,
    upgradeKeys: true,
}

export const selectSpecialGameNormalClause = {
    id: true,
    name: true,
    matchType: true,
    timeControl: true,
    tcMinutes: true,
    tcBonus: true,
    createdAt: true,
    editedAt: true,
    deletedAt: true,
    startedAt: true,
    finishedAt: true,
    owner: {
        select: selectPlayerNormalClause,
    },
    winner: {
        select: selectPlayerNormalClause,
    },
    currentRoundIndex: true,
    totalRounds: true,
    numberOfPlayers: true,
    specialConfiguration: {
        select: selectSpecialConfigurationNormalClause,
    }
};

export const specialGameRepository = {
    /*
    * Create new special game.
    */
    async create(specialGame: NewSpecialGameData): Promise<Result<SpecialGameNormal>> {
        try {
            const estimatedTime = specialGame.tcMinutes + (specialGame.tcBonus * 40) / 60;
            const timeControl =
                estimatedTime < 3 ? "BULLET" :
                estimatedTime < 10 ? "BLITZ" :
                estimatedTime < 60 ? "RAPID" :
                "CLASSIC";
            
            let usedSpecialConfiguration: SpecialConfigurationNormal | undefined = undefined;
            if (specialGame.specialConfigurationId) {
                usedSpecialConfiguration = await prismaClient.specialConfiguration.findUniqueOrThrow({
                    where: {
                        id: specialGame.specialConfigurationId,
                    },
                    select: selectSpecialConfigurationNormalClause,
                });
            }
            else {
                const specialConfigurationDeserialized: SpecialConfigurationNormal = 
                    SpecialChessEngine.deserializeConfiguration(specialGame.specialConfiguration);

                usedSpecialConfiguration = await prismaClient.specialConfiguration.create({
                    data: {
                        name: specialGame.name,
                        variantKey: specialConfigurationDeserialized.variantKey,
                        upgradeKeys: specialConfigurationDeserialized.upgradeKeys.map(
                            upgrade => upgrade as UpgradeKey
                        ),
                        savedBy: {
                            connect: [{ id: specialGame.ownerId }]
                        }
                    },
                    select: selectSpecialConfigurationNormalClause,
                });
            }

            if (!usedSpecialConfiguration) {
                console.error("Failed to load the special game configuration");
                throw Error("Invalid configuration");
            }

            const newSpecialGame = await prismaClient.specialGame.create({
                data: {
                    name: specialGame.name,
                    matchType: specialGame.matchType,
                    timeControl,
                    tcMinutes: specialGame.tcMinutes,
                    tcBonus: specialGame.tcBonus,
                    numberOfPlayers: specialGame.playerIds.length,
                    owner: {
                        connect: { id: specialGame.ownerId },
                    },
                    players: {
                        connect: specialGame.playerIds.map((id) => ({ id })),
                    },
                    specialConfiguration: {
                        connect: { id: usedSpecialConfiguration.id },
                    },
                    ...(specialGame.totalRounds && {
                        totalRounds: specialGame.totalRounds,
                    }),
                },
                select: selectSpecialGameNormalClause,
            });

            return Result.ok(newSpecialGame as SpecialGameNormal);
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
    // Register specialGame leaderboard - create SpecialGameResults
    //
    async registerSpecialGameLeaderboard(specialGameId: string, leaderboard: SpecialGameLeaderboardDbEntry[]): Promise<Result<undefined>> {
        try {
            await prismaClient.specialGameResult.createMany({
                data: leaderboard.map((leaderboardDbEntry, index) => ({
                    specialGameId,
                    resultIndex: index,
                    playerId: leaderboardDbEntry.playerId,
                    roundIndex: leaderboardDbEntry.roundIndex,
                    score: leaderboardDbEntry.score,
                }))
            });

            return Result.ok(undefined);
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
    // Get the leaderboard containing the players in order and their score for specific turn in a specific special game
    //
    async getSpecialGameLeaderboard(specialGameId: string, requestQuery: GetSpecialGameLeaderboardData)
    : Promise<Result<{ leaderboard: SpecialGameResult[], totalCount: number }>> {
        const { page, pagesize: pageSize, keyword, specialGameRoundIndex } = requestQuery;

        const whereClause = {
            specialGameId,
            roundIndex: specialGameRoundIndex,
        };

        const query = {
            where: whereClause,
            ...(page != null && {
                orderBy: [
                    { resultIndex: 'asc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            include: {
                player: { select: selectPlayerNormalClause },
                specialGame: { select: selectSpecialGameNormalClause },
            },
        } satisfies Prisma.SpecialGameResultFindManyArgs;

        try {
            const [ rows, totalCount ] = await prismaClient.$transaction([
                prismaClient.specialGameResult.findMany(query),
                prismaClient.specialGameResult.count({ where: whereClause }),
            ]);

            if (rows.length === 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            const leaderboard: SpecialGameResult[] = rows.map(entry => ({
                id: entry.id,
                player: entry.player,
                specialGame: entry.specialGame,
                resultIndex: entry.resultIndex,
                roundIndex: entry.roundIndex,
                score: entry.score.toNumber(),
                createdAt: entry.createdAt,
            }));

            return Result.ok({ leaderboard: leaderboard as SpecialGameResult[], totalCount });
        }
        catch (e) {
            console.log(e)
            return Result.err(new InternalError());
        }
    },

    /*
    * Update existing specialGame.
    */
    async patch(specialGameId: string, specialGame: PatchSpecialGameData): Promise<Result<SpecialGameNormal>> {
        try {
            if (specialGame.addPlayerIds && specialGame.removePlayerIds) {
                return Result.err(
                    new ConflictError("You cannot use both addPlayerIds and removePlayerIds in the same request.")
                );
            }

            const specialGameData = {
                ...getObjectWithSomeValuables(specialGame,
                    [ "name", "matchType", "timeControl", "tcMinutes", "tcBonus", "startedAt", "finishedAt",
                      "totalRounds", "numberOfPlayers" ]),
                editedAt: new Date(),
            }

            const estimatedTime = (specialGame.tcMinutes !== undefined && specialGame.tcBonus !== undefined)
                ? (specialGame.tcMinutes + (specialGame.tcBonus * 40) / 60)
                : 0;
            const timeControl =
                estimatedTime < 3 ? "BULLET" :
                estimatedTime < 10 ? "BLITZ" :
                estimatedTime < 60 ? "RAPID" :
                "CLASSIC";

            const updatedSpecialGame = await prismaClient.specialGame.update({
                where: {
                    id: specialGameId,
                    deletedAt: null,
                },
                data: {
                    ...specialGameData,
                    ...(specialGame.addPlayerIds && specialGame.addPlayerIds.length > 0 && {
                        players: {
                            connect: specialGame.addPlayerIds.map((id) => ({ id })),
                        },
                    }),
                    ...(specialGame.removePlayerIds && specialGame.removePlayerIds.length > 0 && {
                        players: {
                            disconnect: specialGame.removePlayerIds.map((id) => ({ id })),
                        },
                    }),
                    ...(specialGame.gameIds && specialGame.gameIds.length > 0 && {
                        games: {
                            connect: specialGame.gameIds.map((id) => ({ id })),
                        },
                    }),
                    ...(estimatedTime !== 0 && {
                        timeControl
                    }),
                    ...(specialGame.currentRoundIndex !== undefined && {
                        currentRoundIndex: specialGame.currentRoundIndex,
                    }),
                    ...(specialGame.winnerId && {
                        winner: {
                            connect: { id: specialGame.winnerId },
                        },
                    }),
                },
                select: selectSpecialGameNormalClause,
            });

            return Result.ok(updatedSpecialGame as SpecialGameNormal);
        }
        catch (e) {
            console.log(e)
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2025') {
                    return Result.err(new NotFoundError());
                }
                if (e.code === 'P2002') {
                    return Result.err(new ConflictError('SpecialGame with the provided name already exists.'));
                }
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Mark a selected specialGame as deleted by setting the `deletedAt` property.
    */
    async delete(specialGameId: string): Promise<Result<SpecialGameNormal>> {
        try {
            const currentDate = new Date();

            const deletedSpecialGame = await prismaClient.specialGame.update({
                where: {
                    id: specialGameId,
                    deletedAt: null,
                },
                data: {
                    editedAt: currentDate,
                    deletedAt: currentDate,
                },
                select: selectSpecialGameNormalClause,
            });

            return Result.ok(deletedSpecialGame as SpecialGameNormal);
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
    * Get a specialGame by id
    */
    async getById(specialGameId: string): Promise<Result<SpecialGameNormal>> {
        try {
            const specialGame = await prismaClient.specialGame.findUniqueOrThrow({
                where: {
                    id: specialGameId,
                    deletedAt: null,
                },
                select: selectSpecialGameNormalClause,
            });

            return Result.ok(specialGame as SpecialGameNormal);
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
    * Get all specialGames with normal detailed information (paginated).
    */
    async getAllPaged(requestQuery: z.infer<typeof getAllSpecialGamesRequestSchema.shape.query>)
    : Promise<Result<{ specialGames: SpecialGameNormal[], totalCount: number }>> {
        
        const { page, pagesize: pageSize, keyword, matchType, timeControl, tcMinutes, tcBonus, isAvailable } = requestQuery;
        const whereClause = {
            deletedAt: null,
            ...(keyword && {
                name: {
                    contains: keyword,
                    mode: Prisma.QueryMode.insensitive
                },
            }),
            ...(matchType && {
                matchType,
            }),
            ...(timeControl && {
                timeControl,
            }),
            ...(tcMinutes && {
                tcMinutes,
            }),
            ...(tcBonus && {
                tcBonus,
            }),
            ...(isAvailable === true && {
                startedAt: null,
                finishedAt: null,
            }),
        };

        const query = {
            where: whereClause,
            ...(page != null && {
                orderBy: [
                    { name: 'asc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            select: selectSpecialGameNormalClause,
        } satisfies Prisma.SpecialGameFindManyArgs;

        try {
            const [ specialGames, totalCount ] = await prismaClient.$transaction([
                prismaClient.specialGame.findMany(query),
                prismaClient.specialGame.count({ where: whereClause }),
            ]);

            if (specialGames.length == 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            return Result.ok({ specialGames: specialGames as SpecialGameNormal[], totalCount });
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
    * Get games that are part of the specialGame
    */
    async getSpecialGameGames(specialGameId: string, requestQuery: GetSpecialGameGamesData)
    : Promise<Result<{ games: GameNormal[], totalCount: number }>> {

        const { page, pagesize: pageSize, keyword, specialGameRoundIndex } = requestQuery;
        const whereClause = {
            specialGameId: specialGameId,
            deletedAt: null,
           ...(specialGameRoundIndex && {
                specialGameRoundIndex,
            }),
        };

        const query = {
            where: whereClause,
            ...(page != null && {
                orderBy: [
                    { finishedAt: 'asc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            select: selectGameNormalClause,
        } satisfies Prisma.GameFindManyArgs;

        try {
            const [ games, totalCount ] = await prismaClient.$transaction([
                prismaClient.game.findMany(query),
                prismaClient.game.count({ where: whereClause }),
            ]);

            if (games.length == 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            return Result.ok({ games: games as GameNormal[], totalCount });
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
    * Get players that are part of the specialGame
    */
    async getSpecialGamePlayers(specialGameId: string, requestQuery: GetSpecialGamePlayersData)
    : Promise<Result<{ players: PlayerNormal[], totalCount: number }>> {

        const { page, pagesize: pageSize, keyword } = requestQuery;
        const whereClause = {
            specialGames: {
                some: {
                    id: specialGameId,
                },
            },
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
}
