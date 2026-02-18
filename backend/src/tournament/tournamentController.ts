import { Request, Response } from 'express';
import { tournamentRepository } from './repository/tournamentRepository';
import { handleRepositoryErrors, parseRequest } from '../utils';
import {
    createNewTournamentRequestSchema, deleteTournamentRequestSchema,
    getTournamentRequestSchema, getTournamentGamesRequestSchema,
    patchTournamentRequestSchema, getTournamentPlayersRequestSchema,
    getAllTournamentsRequestSchema,
    getTournamentLeaderboardRequestSchema,
} from './validationSchemas/RESTValidationSchemas';
import {
    ApiRespMulti, ApiRespMultiPaginated,
    ApiRespSingle, Pagination,
} from "../types";
import { TournamentNormal } from "./types";


/*
 * Create a new tournament.
 */
const createNewTournament = async (req: Request, res: Response) => {
    const parsed = await parseRequest(createNewTournamentRequestSchema, req, res);
    if (parsed === null) return;

    const newTournament = await tournamentRepository.create(parsed.body);
    if (newTournament.isErr) {
        handleRepositoryErrors(newTournament.error, res);
        return;
    }
    res.status(201).send({
        item: newTournament.value,
        message: "OK",
    } satisfies ApiRespSingle<TournamentNormal>);
};

/*
 * Update an existing tournament.
 */
const patchTournament = async (req: Request, res: Response) => {
    const parsed = await parseRequest(patchTournamentRequestSchema, req, res);
    if (parsed === null) return;

    const updatedTournament = await tournamentRepository.patch(parsed.params.tournamentId, parsed.body);

    if (updatedTournament.isErr) {
        handleRepositoryErrors(updatedTournament.error, res);
        return;
    }

    res.status(200).send({
        item: updatedTournament.value,
        message: "OK",
    } satisfies ApiRespSingle<TournamentNormal>);
}

/*
 * Mark tournament as deleted by setting deletedAt timestamp.
 */
const deleteTournament = async (req: Request, res: Response) => {
    const parsed = await parseRequest(deleteTournamentRequestSchema, req, res);
    if (parsed === null) return;

    const deletedTournament = await tournamentRepository.delete(parsed.params.tournamentId);
    if (deletedTournament.isErr) {
        handleRepositoryErrors(deletedTournament.error, res);
        return;
    }
    res.status(204).send();
}

/*
 * Get tournament by ID.
 */
const getTournamentById = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getTournamentRequestSchema, req, res);
    if (parsed === null) return;

    const tournament = await tournamentRepository.getById(parsed.params.tournamentId);
    if (tournament.isErr) {
        handleRepositoryErrors(tournament.error, res);
        return;
    }
    res.status(200).send({
        item: tournament.value,
        message: "OK",
    } satisfies ApiRespSingle<TournamentNormal>);
}

/*
 * Get all tournaments with normal detailed information (paginated).
 */
const getAllTournaments = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getAllTournamentsRequestSchema, req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const tournamentsAndCount = await tournamentRepository.getAllPaged(parsed.query);
    if (tournamentsAndCount.isErr) {
        handleRepositoryErrors(tournamentsAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: tournamentsAndCount.value.tournaments,
            message: "OK",
        } satisfies ApiRespMulti<TournamentNormal>
        :
        {
            items: tournamentsAndCount.value.tournaments,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(tournamentsAndCount.value.totalCount / pageSize),
                totalItemCount: tournamentsAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<TournamentNormal>);
}

/*
 * Get games of a specific tournament.
 */
const getTournamentGames = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getTournamentGamesRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const tournamentGamesAndCount
        = await tournamentRepository.getTournamentGames(parsed.params.tournamentId,
                                                   parsed.query);
    if (tournamentGamesAndCount.isErr) {
        handleRepositoryErrors(tournamentGamesAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: tournamentGamesAndCount.value.games,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: tournamentGamesAndCount.value.games,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    tournamentGamesAndCount.value.totalCount
                    / pageSize),
                totalItemCount: tournamentGamesAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

/*
 * Get leaderboard of a specific tournament.
 */
const getTournamentLeaderboard = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getTournamentLeaderboardRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const tournamentLeaderbordRowsAndCount
        = await tournamentRepository.getTournamentLeaderboard(parsed.params.tournamentId,
                                                              parsed.query);
    if (tournamentLeaderbordRowsAndCount.isErr) {
        handleRepositoryErrors(tournamentLeaderbordRowsAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: tournamentLeaderbordRowsAndCount.value.leaderboard,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: tournamentLeaderbordRowsAndCount.value.leaderboard,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    tournamentLeaderbordRowsAndCount.value.totalCount
                    / pageSize),
                totalItemCount: tournamentLeaderbordRowsAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

/*
 * Get players of a specific tournament.
 */
const getTournamentPlayers = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getTournamentPlayersRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const tournamentPlayersAndCount
        = await tournamentRepository.getTournamentPlayers(parsed.params.tournamentId,
                                                   parsed.query);
    if (tournamentPlayersAndCount.isErr) {
        handleRepositoryErrors(tournamentPlayersAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: tournamentPlayersAndCount.value.players,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: tournamentPlayersAndCount.value.players,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    tournamentPlayersAndCount.value.totalCount
                    / pageSize),
                totalItemCount: tournamentPlayersAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

export {
    createNewTournament,
    patchTournament,
    deleteTournament,
    getTournamentById,
    getAllTournaments,
    getTournamentGames,
    getTournamentPlayers,
    getTournamentLeaderboard,
}
