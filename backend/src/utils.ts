import { GameMode, MatchType, Prisma, TimeControl } from '@prisma/client';
import type { Request, Response } from 'express';
import type { ZodSchema, ZodTypeDef } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { PlayerNormal } from './player/types';
import { GameNormal } from './game/types';


export class NotFoundError   extends Error {}
export class BadRequestError extends Error {}
export class ConflictError   extends Error {}
export class InternalError   extends Error {}

export const handleRepositoryErrors = (e: Error, res: Response) => {
    const respond = (status: number, name: string, message: string) => {
        res.status(status).json({
            error: {
                name,
                message,
            },
        });
    };

    if (e instanceof NotFoundError) {
        respond(404, e.name || 'NotFoundError', e.message || 'Entity not found');
        return;
    }

    if (e instanceof BadRequestError) {
        respond(400, e.name || 'BadRequestError', e.message || 'Bad request');
        return;
    }

    if (e instanceof ConflictError) {
        respond(409, e.name || 'ConflictError', e.message || 'Conflict');
        return;
    }

    if (e instanceof InternalError) {
        respond(500, e.name || 'InternalError', e.message || 'Something went wrong on our side.');
        return;
    }

    console.error('Unhandled repository error', e);
    respond(500, 'UnknownError', 'Something went wrong.');
};

export const parseRequest = async <Output, Def extends ZodTypeDef = ZodTypeDef, Input = Output>(
                            schema: ZodSchema<Output, Def, Input>, req: Request, res: Response) => {
    const parsedRequest = await schema.safeParseAsync(req);

    if (!parsedRequest.success) {
        const error = fromZodError(parsedRequest.error);
        const errorResponse: Error = {
            name: 'ValidationError',
            message: error.message,
            stack: error.stack,
        };
        res.status(400).send(errorResponse);
        return null;
    }

    return parsedRequest.data;
};


type Valuable<T> = {
    [K in keyof T as T[K] extends null | undefined
    ? never : K]: T[K]
};

/*
 * Create a new object with valuable (non-nullish) properties only.
 *
 * Taken from: https://medium.com/mizyind-singularity/remove-blank-attributes
 *               -from-an-object-in-typescript-with-type-safe-ad4fd78a061c
 */
export function getObjectWithValuables<T extends {}, V = Valuable<T>>(obj: T): V {
    return Object.fromEntries(
        Object.entries(obj).filter(
            ([, v]) => !(
                (typeof v === 'string' && !v.length) ||
                v === null ||
                typeof v === 'undefined'
            ),
        ),
    ) as V;
}

/*
 * Create a new object with requested valuable (non-nullish) properties only.
 *
 */
export function getObjectWithSomeValuables(object: {[key: string] : any},
                                           wantedKeys: Array<string>) {
    const newObject = Object
        .keys(object)
        .filter(key => wantedKeys.includes(key))
        .reduce((obj: {[key: string] : any}, key) => {
            obj[key] = object[key];
            return obj;
        }, {});

    return getObjectWithValuables(newObject);
}

//
// Get a new object **with** selected properties only.
//
export function getObjectWithSome(object: {[key: string] : any},
                                  keysToLeave: Array<string>) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => keysToLeave.includes(key))
  );
}

//
// Get a new object **without** selected properties.
//
// Note: Inspiration from:
//         https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields
//
export function getObjectWithoutSome(object: {[key: string] : any},
                                     keysToExclude: Array<string>) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keysToExclude.includes(key))
  );
}


/*
 * Get a local system date with hours, minutes, seconds and ms stripped.
 */
export const getCurrentLocalDate = (): Date => {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now;
};

export const getShiftedDate = (dateTime: Date, deltaInDays: number) => {
    let newDateTime = new Date(dateTime);
    newDateTime.setDate(dateTime.getDate() + deltaInDays);
    return newDateTime;
};

export const filterBlackPlayerByNickname = (keyword: string) => {
    return [{
        blackPlayer: {
            nickname: {
                contains: keyword,
                mode: Prisma.QueryMode.insensitive
            }
        }
    }];
};

export const filterWhitePlayerByNickname = (keyword: string) => {
    return [{
        whitePlayer: {
            nickname: {
                contains: keyword,
                mode: Prisma.QueryMode.insensitive
            }
        }
    }];
};

export const parseElo = (isPlayer1White: boolean, gameMode: GameMode, 
    timeControl: TimeControl, player1: PlayerNormal, player2: PlayerNormal) => {

        const player = isPlayer1White ? player1 : player2;

        if (gameMode == GameMode.CLASSIC) {
            switch (timeControl) {
                case TimeControl.BLITZ:   return player.eloRankedBlitz;
                case TimeControl.BULLET:  return player.eloRankedBullet;
                case TimeControl.RAPID:   return player.eloRankedRapid;
                default:                  return player.eloRankedClassic;
            }
        } else {
            switch (timeControl) {
                case TimeControl.BLITZ:   return player.eloSpecialBlitz;
                case TimeControl.BULLET:  return player.eloSpecialBullet;
                case TimeControl.RAPID:   return player.eloSpecialRapid;
                default:                  return player.eloSpecialClassic;
            }
        }
};

export const calculateElo = (whiteEloBefore: number, blackEloBefore: number, scoreWhite: number,
                             scoreBlack: number, k: number = 20
): { whiteEloAfter: number; blackEloAfter: number } => {
  const expectedA = 1 / (1 + Math.pow(10, (blackEloBefore - whiteEloBefore) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (whiteEloBefore - blackEloBefore) / 400));

  const whiteEloAfter = Math.round(whiteEloBefore + k * (scoreWhite - expectedA));
  const blackEloAfter = Math.round(blackEloBefore + k * (scoreBlack - expectedB));

  return { whiteEloAfter, blackEloAfter };
};

export const assignEloAfter = (game: GameNormal, eloAfter: number) => {
    return {
        ...(game.gameMode === GameMode.CLASSIC && game.matchType == MatchType.RATED && game.timeControl == TimeControl.CLASSIC && {
            eloRankedClassic: eloAfter,
        }),
        ...(game.gameMode === GameMode.CLASSIC && game.matchType == MatchType.RATED && game.timeControl == TimeControl.BULLET && {
            eloRankedBullet: eloAfter,
        }),
        ...(game.gameMode === GameMode.CLASSIC && game.matchType == MatchType.RATED && game.timeControl == TimeControl.BLITZ && {
            eloRankedBlitz: eloAfter,
        }),
        ...(game.gameMode === GameMode.CLASSIC && game.matchType == MatchType.RATED && game.timeControl == TimeControl.RAPID && {
            eloRankedRapid: eloAfter,
        }),
        ...(game.gameMode === GameMode.SPECIAL && game.matchType == MatchType.RATED && game.timeControl == TimeControl.CLASSIC && {
            eloSpecialClassic: eloAfter,
        }),
        ...(game.gameMode === GameMode.SPECIAL && game.matchType == MatchType.RATED && game.timeControl == TimeControl.BULLET && {
            eloSpecialBullet: eloAfter,
        }),
        ...(game.gameMode === GameMode.SPECIAL && game.matchType == MatchType.RATED && game.timeControl == TimeControl.BLITZ && {
            eloSpecialBlitz: eloAfter,
        }),
        ...(game.gameMode === GameMode.SPECIAL && game.matchType == MatchType.RATED && game.timeControl == TimeControl.RAPID && {
            eloSpecialRapid: eloAfter,
        }),
    }
};
