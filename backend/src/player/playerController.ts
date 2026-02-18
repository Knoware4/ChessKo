import { Request, Response } from 'express';
import { playerRepository } from './repository/playerRepository';
import { handleRepositoryErrors, parseRequest } from '../utils';
import {
    getMultipleModelsSchema,
} from '../generalValidationSchemas';
import {
    createNewPlayerRequestSchema, deletePlayerRequestSchema,
    getPlayerByEmailRequestSchema, getPlayerRequestSchema,
    getPlayerGamesRequestSchema, patchPlayerRequestSchema,
    getPlayerTournamentsRequestSchema,
    getPlayerSavedConfigurationsRequestSchema,
    getPlayerSpecialGamesRequestSchema,
} from './validationSchemas/RESTValidationSchemas';
import {
    ApiRespMulti, ApiRespMultiPaginated,
    ApiRespSingle, Pagination,
} from "../types";
import { PlayerLess, PlayerNormal } from "./types";


/*
 * Create a new player.
 */
const createNewPlayer = async (req: Request, res: Response) => {
    const parsed = await parseRequest(createNewPlayerRequestSchema, req, res);
    if (parsed === null) return;

    const newPlayer = await playerRepository.create(parsed.body);
    if (newPlayer.isErr) {
        handleRepositoryErrors(newPlayer.error, res);
        return;
    }
    res.status(201).send({
        item: newPlayer.value,
        message: "OK",
    } satisfies ApiRespSingle<PlayerNormal>);
};

/*
 * Update an existing player.
 */
const patchPlayer = async (req: Request, res: Response) => {
    const parsed = await parseRequest(patchPlayerRequestSchema, req, res);
    if (parsed === null) return;

    const updatedPlayer = await playerRepository.patch(parsed.params.playerId, parsed.body);

    if (updatedPlayer.isErr) {
        handleRepositoryErrors(updatedPlayer.error, res);
        return;
    }

    res.status(200).send({
        item: updatedPlayer.value,
        message: "OK",
    } satisfies ApiRespSingle<PlayerNormal>);
}

/*
 * Mark player as deleted by setting deletedAt timestamp.
 */
const deletePlayer = async (req: Request, res: Response) => {
    const parsed = await parseRequest(deletePlayerRequestSchema, req, res);
    if (parsed === null) return;

    const deletedPlayer = await playerRepository.delete(parsed.params.playerId);
    if (deletedPlayer.isErr) {
        handleRepositoryErrors(deletedPlayer.error, res);
        return;
    }
    res.status(204).send();
}

/*
 * Get player by ID.
 */
const getPlayerById = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getPlayerRequestSchema, req, res);
    if (parsed === null) return;

    const player = await playerRepository.getById(parsed.params.playerId);
    if (player.isErr) {
        handleRepositoryErrors(player.error, res);
        return;
    }
    res.status(200).send({
        item: player.value,
        message: "OK",
    } satisfies ApiRespSingle<PlayerNormal>);
}

/*
 * Get player by email.
 */
const getPlayerByEmail = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getPlayerByEmailRequestSchema, req, res);
    if (parsed === null) return;

    const player = await playerRepository.getByEmail(parsed.params.playerEmail);
    if (player.isErr) {
        handleRepositoryErrors(player.error, res);
        return;
    }
    res.status(200).send({
        item: player.value,
        message: "OK",
    } satisfies ApiRespSingle<PlayerNormal>);
}

/*
 * Get all players with less detailed information.
 */
const getAllPlayersLess = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getMultipleModelsSchema, req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const playersAndCount = await playerRepository.getAllPagedLess(parsed.query);
    if (playersAndCount.isErr) {
        handleRepositoryErrors(playersAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: playersAndCount.value.players,
            message: "OK",
        } satisfies ApiRespMulti<PlayerLess>
        :
        {
            items: playersAndCount.value.players,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(playersAndCount.value.totalCount / pageSize),
                totalItemCount: playersAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<PlayerLess>);
}

/*
 * Get all players with normal detailed information.
 */
const getAllPlayersNormal = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getMultipleModelsSchema, req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const playersAndCount = await playerRepository.getAllPagedNormal(parsed.query);
    if (playersAndCount.isErr) {
        handleRepositoryErrors(playersAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: playersAndCount.value.players,
            message: "OK",
        } satisfies ApiRespMulti<PlayerNormal>
        :
        {
            items: playersAndCount.value.players,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(playersAndCount.value.totalCount / pageSize),
                totalItemCount: playersAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<PlayerNormal>);
}

/*
 * Get games of a specific player.
 */
const getPlayerGames = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getPlayerGamesRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const playerGamesAndCount
        = await playerRepository.getPlayerGames(parsed.params.playerId,
                                                   parsed.query);
    if (playerGamesAndCount.isErr) {
        handleRepositoryErrors(playerGamesAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: playerGamesAndCount.value.games,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: playerGamesAndCount.value.games,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    playerGamesAndCount.value.totalCount
                    / pageSize),
                totalItemCount: playerGamesAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

/*
 * Get tournaments of a specific player.
 */
const getPlayerTournaments = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getPlayerTournamentsRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const playerTournamentsAndCount
        = await playerRepository.getPlayerTournaments(parsed.params.playerId,
                                                   parsed.query);
    if (playerTournamentsAndCount.isErr) {
        handleRepositoryErrors(playerTournamentsAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: playerTournamentsAndCount.value.tournaments,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: playerTournamentsAndCount.value.tournaments,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    playerTournamentsAndCount.value.totalCount
                    / pageSize),
                totalItemCount: playerTournamentsAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

/*
 * Get special games of a specific player.
 */
const getPlayerSpecialGames = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getPlayerSpecialGamesRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const playerSpecialGamesAndCount
        = await playerRepository.getPlayerSpecialGames(parsed.params.playerId,
                                                   parsed.query);
    if (playerSpecialGamesAndCount.isErr) {
        handleRepositoryErrors(playerSpecialGamesAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: playerSpecialGamesAndCount.value.specialGames,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: playerSpecialGamesAndCount.value.specialGames,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    playerSpecialGamesAndCount.value.totalCount
                    / pageSize),
                totalItemCount: playerSpecialGamesAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

/*
 * Get saved special configurations of a specific player.
 */
const getPlayerSavedConfigurations = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getPlayerSavedConfigurationsRequestSchema,
                                      req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const playerSavedConfigurationsAndCount
        = await playerRepository.getPlayerSavedConfigurations(parsed.params.playerId,
                                                              parsed.query);
    if (playerSavedConfigurationsAndCount.isErr) {
        handleRepositoryErrors(playerSavedConfigurationsAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: playerSavedConfigurationsAndCount.value.specialConfigurations,
            message: "OK",
        } satisfies ApiRespMulti<any>
        :
        {
            items: playerSavedConfigurationsAndCount.value.specialConfigurations,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(
                    playerSavedConfigurationsAndCount.value.totalCount
                    / pageSize),
                totalItemCount: playerSavedConfigurationsAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<any>);
}

export {
    createNewPlayer,
    patchPlayer,
    deletePlayer,
    getPlayerById,
    getPlayerByEmail,
    getAllPlayersNormal,
    getAllPlayersLess,
    getPlayerGames,
    getPlayerTournaments,
    getPlayerSpecialGames,
    getPlayerSavedConfigurations,
}
