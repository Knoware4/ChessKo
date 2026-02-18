import {
    NewTournamentData, PatchTournamentData,
    TournamentNormal, GetTournamentGamesData,
    GetTournamentPlayersData,
    TournamentResult,
    GetTournamentLeaderboardData,
} from "../types";
import prismaClient from "../../prismaClient";
import { Result } from "@badrap/result";
import { Prisma } from "@prisma/client";
import {
    getObjectWithSomeValuables, ConflictError,
    InternalError, NotFoundError,
} from "../../utils";
import z from "zod";
import { selectPlayerNormalClause } from "../../player/repository/playerRepository";
import { getAllTournamentsRequestSchema } from "../validationSchemas/RESTValidationSchemas";
import { PlayerNormal } from "../../player/types";
import { GameNormal } from "../../game/types";
import { selectGameNormalClause } from "../../game/repository/gameRepository";
import { TournamentLeaderboardDbEntry } from "../../sockets/socketHandlers/tournaments/swissTournamentLogic/types";


export const selectTournamentNormalClause = {
    id: true,
    name: true,
    timeControl: true,
    tcMinutes: true,
    tcBonus: true,
    createdAt: true,
    editedAt: true,
    deletedAt: true,
    startedAt:true,
    finishedAt: true,
    owner: true,
    winner: true,
    currentRoundIndex: true,
    totalRounds: true,
    numberOfPlayers: true,
};

export const tournamentRepository = {
    /*
    * Create new tournament.
    */
    async create(tournament: NewTournamentData): Promise<Result<TournamentNormal>> {
        try {
            const estimatedTime = tournament.tcMinutes + (tournament.tcBonus * 40) / 60;
            const timeControl =
                estimatedTime < 3 ? "BULLET" :
                estimatedTime < 10 ? "BLITZ" :
                estimatedTime < 60 ? "RAPID" :
                "CLASSIC";

            const newTournament = await prismaClient.tournament.create({
                data: {
                    name: tournament.name,
                    timeControl,
                    tcMinutes: tournament.tcMinutes,
                    tcBonus: tournament.tcBonus,
                    numberOfPlayers: tournament.playerIds.length,
                    owner: {
                        connect: { id: tournament.ownerId },
                    },
                    players: {
                        connect: tournament.playerIds.map((id) => ({ id })),
                    },
                },
                select: selectTournamentNormalClause,
            });

            return Result.ok(newTournament as TournamentNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError
                && e.code === 'P2025') {
                return Result.err(new ConflictError());
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Register tournament leaderboard - create TournamentResults
    */
    async registerTournamentLeaderboard(tournamentId: string, leaderboard: TournamentLeaderboardDbEntry[]): Promise<Result<undefined>> {
        try {
            await prismaClient.tournamentResult.createMany({
                data: leaderboard.map((leaderboardDbEntry, index) => ({
                    tournamentId,
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

    /*
    * Get the leaderboard containing the players in order and their score for specific turn in a specific tournament
    */
    async getTournamentLeaderboard(tournamentId: string, requestQuery: GetTournamentLeaderboardData)
    : Promise<Result<{ leaderboard: TournamentResult[], totalCount: number }>> {
        const { page, pagesize: pageSize, keyword, tournamentRoundIndex } = requestQuery;

        const whereClause = {
            tournamentId,
            roundIndex: tournamentRoundIndex,
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
            },
        } satisfies Prisma.TournamentResultFindManyArgs;

        try {
            const [ rows, totalCount ] = await prismaClient.$transaction([
                prismaClient.tournamentResult.findMany(query),
                prismaClient.tournamentResult.count({ where: whereClause }),
            ]);

            if (rows.length === 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            const leaderboard: TournamentResult[] = rows.map(entry => ({
                id: entry.id,
                player: entry.player,
                resultIndex: entry.resultIndex,
                roundIndex: entry.roundIndex,
                score: entry.score.toNumber(),
                createdAt: entry.createdAt,
            }));

            return Result.ok({ leaderboard: leaderboard as TournamentResult[], totalCount });
        }
        catch (e) {
            return Result.err(new InternalError());
        }
    },

    /*
    * Update existing tournament.
    */
    async patch(tournamentId: string, tournament: PatchTournamentData): Promise<Result<TournamentNormal>> {
        try {
            if (tournament.addPlayerIds && tournament.removePlayerIds) {
                return Result.err(
                    new ConflictError("You cannot use both addPlayerIds and removePlayerIds in the same request.")
                );
            }

            const tournamentData = {
                ...getObjectWithSomeValuables(tournament,
                    [ "name", "timeControl", "tcMinutes", "tcBonus", "startedAt", "finishedAt",
                      "totalRounds", "numberOfPlayers", "specialConfiguration" ]),
                editedAt: new Date(),
            }

            const estimatedTime = (tournament.tcMinutes !== undefined && tournament.tcBonus !== undefined)
                ? (tournament.tcMinutes + (tournament.tcBonus * 40) / 60)
                : 0;
            const timeControl =
                estimatedTime < 3 ? "BULLET" :
                estimatedTime < 10 ? "BLITZ" :
                estimatedTime < 60 ? "RAPID" :
                "CLASSIC";

            const updatedTournament = await prismaClient.tournament.update({
                where: {
                    id: tournamentId,
                    deletedAt: null,
                },
                data: {
                    ...tournamentData,
                    ...(tournament.addPlayerIds && tournament.addPlayerIds.length > 0 && {
                        players: {
                            connect: tournament.addPlayerIds.map((id) => ({ id })),
                        },
                    }),
                    ...(tournament.removePlayerIds && tournament.removePlayerIds.length > 0 && {
                        players: {
                            disconnect: tournament.removePlayerIds.map((id) => ({ id })),
                        },
                    }),
                    ...(tournament.gameIds && tournament.gameIds.length > 0 && {
                        games: {
                            connect: tournament.gameIds.map((id) => ({ id })),
                        },
                    }),
                    ...(estimatedTime !== 0 && {
                        timeControl
                    }),
                    ...(tournament.currentRoundIndex !== undefined && {
                        currentRoundIndex: tournament.currentRoundIndex,
                    }),
                    ...(tournament.winnerId && {
                        winner: {
                            connect: { id: tournament.winnerId },
                        },
                    }),
                },
                select: selectTournamentNormalClause,
            });

            return Result.ok(updatedTournament as TournamentNormal);
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2025') {
                    return Result.err(new NotFoundError());
                }
                if (e.code === 'P2002') {
                    return Result.err(new ConflictError('Tournament with the provided name already exists.'));
                }
            }
            return Result.err(new InternalError());
        }
    },

    /*
    * Mark a selected tournament as deleted by setting the `deletedAt` property.
    */
    async delete(tournamentId: string): Promise<Result<TournamentNormal>> {
        try {
            const currentDate = new Date();

            const deletedTournament = await prismaClient.tournament.update({
                where: {
                    id: tournamentId,
                    deletedAt: null,
                },
                data: {
                    editedAt: currentDate,
                    deletedAt: currentDate,
                },
                select: selectTournamentNormalClause,
            });

            return Result.ok(deletedTournament as TournamentNormal);
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
    * Get a tournament by id
    */
    async getById(tournamentId: string): Promise<Result<TournamentNormal>> {
        try {
            const tournament = await prismaClient.tournament.findUniqueOrThrow({
                where: {
                    id: tournamentId,
                    deletedAt: null,
                },
                select: selectTournamentNormalClause,
            });

            return Result.ok(tournament as TournamentNormal);
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
    * Get all tournaments with normal detailed information (paginated).
    */
    async getAllPaged(requestQuery: z.infer<typeof getAllTournamentsRequestSchema.shape.query>)
    : Promise<Result<{ tournaments: TournamentNormal[], totalCount: number }>> {
        
        const { page, pagesize: pageSize, keyword, timeControl, tcMinutes, tcBonus, isAvailable } = requestQuery;
        const whereClause = {
            deletedAt: null,
            ...(keyword && {
                name: {
                    contains: keyword,
                    mode: Prisma.QueryMode.insensitive
                },
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
            select: selectTournamentNormalClause,
        } satisfies Prisma.TournamentFindManyArgs;

        try {
            const [ tournaments, totalCount ] = await prismaClient.$transaction([
                prismaClient.tournament.findMany(query),
                prismaClient.tournament.count({ where: whereClause }),
            ]);

            if (tournaments.length == 0) {
                if (page != null && page > 1) {
                    return Result.err(new NotFoundError());
                }
            }

            return Result.ok({ tournaments: tournaments as TournamentNormal[], totalCount });
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
    * Get games that are part of the tournament
    */
    async getTournamentGames(tournamentId: string, requestQuery: GetTournamentGamesData)
    : Promise<Result<{ games: GameNormal[], totalCount: number }>> {

        const { page, pagesize: pageSize, keyword, tournamentRoundIndex } = requestQuery;
        const whereClause = {
            tournamentId: tournamentId,
            deletedAt: null,
           ...(tournamentRoundIndex && {
                tournamentRoundIndex,
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
    * Get players that are part of the tournament
    */
    async getTournamentPlayers(tournamentId: string, requestQuery: GetTournamentPlayersData)
    : Promise<Result<{ players: PlayerNormal[], totalCount: number }>> {

        const { page, pagesize: pageSize, keyword } = requestQuery;
        const whereClause = {
            tournaments: {
                some: {
                    id: tournamentId,
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
