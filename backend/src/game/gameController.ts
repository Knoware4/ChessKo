import { Request, Response } from 'express';
import { gameRepository } from './repository/gameRepository';
import { handleRepositoryErrors, parseRequest } from '../utils';
import {
    createNewGameRequestSchema, deleteGameRequestSchema,
    getGameRequestSchema, getAllGamesRequestSchema, patchGameRequestSchema,
} from './validationSchemas/RESTValidationSchemas';
import {
    ApiRespMulti, ApiRespMultiPaginated,
    ApiRespSingle, Pagination,
} from "../types";
import { GameNormal } from "./types";


const createNewGame = async (req: Request, res: Response) => {
    const parsed = await parseRequest(createNewGameRequestSchema, req, res);
    if (parsed === null) return;

    const newGame = await gameRepository.create(parsed.body);
    if (newGame.isErr) {
        handleRepositoryErrors(newGame.error, res);
        return;
    }
    res.status(201).send({
        item: newGame.value,
        message: "OK",
    } satisfies ApiRespSingle<GameNormal>);
};

const patchGame = async (req: Request, res: Response) => {
    const parsed = await parseRequest(patchGameRequestSchema, req, res);
    if (parsed === null) return;

    const updatedGame = await gameRepository.patch(parsed.params.gameId, parsed.body);

    if (updatedGame.isErr) {
        handleRepositoryErrors(updatedGame.error, res);
        return;
    }

    res.status(200).send({
        item: updatedGame.value,
        message: "OK",
    } satisfies ApiRespSingle<GameNormal>);
}

const deleteGame = async (req: Request, res: Response) => {
    const parsed = await parseRequest(deleteGameRequestSchema, req, res);
    if (parsed === null) return;

    const deletedGame = await gameRepository.delete(parsed.params.gameId);
    if (deletedGame.isErr) {
        handleRepositoryErrors(deletedGame.error, res);
        return;
    }
    res.status(204).send();
}

const getGameById = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getGameRequestSchema, req, res);
    if (parsed === null) return;

    const game = await gameRepository.getById(parsed.params.gameId);
    if (game.isErr) {
        handleRepositoryErrors(game.error, res);
        return;
    }
    res.status(200).send({
        item: game.value,
        message: "OK",
    } satisfies ApiRespSingle<GameNormal>);
}

const getAllGames = async (req: Request, res: Response) => {
    const parsed = await parseRequest(getAllGamesRequestSchema, req, res);
    if (parsed === null) return;

    const pageSize = parsed.query.pagesize;

    const gamesAndCount = await gameRepository.getAllPaged(parsed.query);
    if (gamesAndCount.isErr) {
        handleRepositoryErrors(gamesAndCount.error, res);
        return;
    }

    res.status(200).send(
        parsed.query.page == null
        ?
        {
            items: gamesAndCount.value.games,
            message: "OK",
        } satisfies ApiRespMulti<GameNormal>
        :
        {
            items: gamesAndCount.value.games,
            message: "OK",
            pagination: {
                currentPage: parsed.query.page,
                pageSize: pageSize,
                totalPages: Math.ceil(gamesAndCount.value.totalCount / pageSize),
                totalItemCount: gamesAndCount.value.totalCount,
            } satisfies Pagination,
        } satisfies ApiRespMultiPaginated<GameNormal>);
}

export {
    createNewGame,
    patchGame,
    deleteGame,
    getGameById,
    getAllGames,
}
