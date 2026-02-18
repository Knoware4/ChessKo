import { Request, Response } from 'express';
import { specialGameRepository } from './repository/specialGameRepository';
import { handleRepositoryErrors, parseRequest } from '../utils';
import {
    createNewSpecialGameRequestSchema, deleteSpecialGameRequestSchema,
    getSpecialGameRequestSchema, getSpecialGameGamesRequestSchema,
    patchSpecialGameRequestSchema, getSpecialGamePlayersRequestSchema,
    getAllSpecialGamesRequestSchema, getSpecialGameLeaderboardRequestSchema,
} from './validationSchemas/RESTValidationSchemas';
import {
    ApiRespMulti, ApiRespMultiPaginated,
    ApiRespSingle, Pagination,
} from "../types";
import { SpecialGameNormal } from "./types";


/*
 * Create a new specialGame.
 */
const createNewSpecialGame = async (req: Request, res: Response) => {
    const parsed = await parseRequest(createNewSpecialGameRequestSchema, req, res);
    if (parsed === null) return;

    const newSpecialGame = await specialGameRepository.create(parsed.body);
    if (newSpecialGame.isErr) {
        handleRepositoryErrors(newSpecialGame.error, res);
        return;
    }
    res.status(201).send({
        item: newSpecialGame.value,
        message: "OK",
    } satisfies ApiRespSingle<SpecialGameNormal>);
};

/*
 * Update an existing specialGame.
 */
const patchSpecialGame = async (req: Request, res: Response) => {
    const parsed = await parseRequest(patchSpecialGameRequestSchema, req, res);
    if (parsed === null) return;

    const updatedSpecialGame = await specialGameRepository.patch(parsed.params.specialGameId, parsed.body);

    if (updatedSpecialGame.isErr) {
        handleRepositoryErrors(updatedSpecialGame.error, res);
        return;
    }

    res.status(200).send({
        item: updatedSpecialGame.value,
        message: "OK",
    } satisfies ApiRespSingle<SpecialGameNormal>);
}

/*
 * Mark specialGame as deleted by setting deletedAt timestamp.
 */
const deleteSpecialGame = async (req: Request, res: Response) => {
    const parsed = await parseRequest(deleteSpecialGameRequestSchema, req, res);
    if (parsed === null) return;

    const deletedSpecialGame = await specialGameRepository.delete(parsed.params.specialGameId);
    if (deletedSpecialGame.isErr) {
        handleRepositoryErrors(deletedSpecialGame.error, res);
        return;
    }
    res.status(204).send();
}

/*
 * Get specialGame by ID.
 */
const getSpecialGameById = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getSpecialGameRequestSchema, req, res);
    if (parsed === null) return;

    const specialGame = await specialGameRepository.getById(parsed.params.specialGameId);
    if (specialGame.isErr) {
        handleRepositoryErrors(specialGame.error, res);
        return;
    }
    res.status(200).send({
        item: specialGame.value,
        message: "OK",
    } satisfies ApiRespSingle<SpecialGameNormal>);
}

/*
 * Get all specialGames with normal detailed information (paginated).
 */
const getAllSpecialGames = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getAllSpecialGamesRequestSchema, req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const specialGamesAndCount = await specialGameRepository.getAllPaged(parsed.query);
    if (specialGamesAndCount.isErr) {
        handleRepositoryErrors(specialGamesAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: specialGamesAndCount.value.specialGames,
            message: "OK",
        } satisfies ApiRespMulti<SpecialGameNormal>
        :
        {
            items: specialGamesAndCount.value.specialGames,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(specialGamesAndCount.value.totalCount / pageSize),
                totalItemCount: specialGamesAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<SpecialGameNormal>);
}

/*
 * Get games of a specific specialGame.
 */
const getSpecialGameGames = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getSpecialGameGamesRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const specialGameGamesAndCount
        = await specialGameRepository.getSpecialGameGames(parsed.params.specialGameId,
                                                   parsed.query);
    if (specialGameGamesAndCount.isErr) {
        handleRepositoryErrors(specialGameGamesAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: specialGameGamesAndCount.value.games,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: specialGameGamesAndCount.value.games,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    specialGameGamesAndCount.value.totalCount
                    / pageSize),
                totalItemCount: specialGameGamesAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

/*
 * Get players of a specific specialGame.
 */
const getSpecialGamePlayers = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getSpecialGamePlayersRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const specialGamePlayersAndCount
        = await specialGameRepository.getSpecialGamePlayers(parsed.params.specialGameId,
                                                   parsed.query);
    if (specialGamePlayersAndCount.isErr) {
        handleRepositoryErrors(specialGamePlayersAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: specialGamePlayersAndCount.value.players,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: specialGamePlayersAndCount.value.players,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    specialGamePlayersAndCount.value.totalCount
                    / pageSize),
                totalItemCount: specialGamePlayersAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

//
// Get leaderboard of a specific specialGame.
//
const getSpecialGameLeaderboard = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getSpecialGameLeaderboardRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const specialGameLeaderbordRowsAndCount
        = await specialGameRepository.getSpecialGameLeaderboard(parsed.params.specialGameId,
                                                              parsed.query);
    if (specialGameLeaderbordRowsAndCount.isErr) {
        handleRepositoryErrors(specialGameLeaderbordRowsAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: specialGameLeaderbordRowsAndCount.value.leaderboard,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: specialGameLeaderbordRowsAndCount.value.leaderboard,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    specialGameLeaderbordRowsAndCount.value.totalCount
                    / pageSize),
                totalItemCount: specialGameLeaderbordRowsAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}


export {
    createNewSpecialGame,
    patchSpecialGame,
    deleteSpecialGame,
    getSpecialGameById,
    getAllSpecialGames,
    getSpecialGameGames,
    getSpecialGamePlayers,
    getSpecialGameLeaderboard,
};
