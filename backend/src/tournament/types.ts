import type { BaseModelTimestamps } from '../types';
import { z } from "zod";
import {
    createNewTournamentRequestSchema,
    patchTournamentRequestSchema,
    getTournamentGamesRequestSchema,
    getAllTournamentsRequestSchema,
    tournamentRequestSchema,
    getTournamentPlayersRequestSchema,
    tournamentResultRequestSchema,
    getTournamentLeaderboardRequestSchema,
} from "./validationSchemas/RESTValidationSchemas";


type ObjectWithTournamentIdOnly = {
    id: string,
};

type NewTournamentData = z.infer<typeof createNewTournamentRequestSchema.shape.body>;

type PatchTournamentData = z.infer<typeof patchTournamentRequestSchema.shape.body>;

type GetTournamentGamesData = z.infer<typeof getTournamentGamesRequestSchema.shape.query>;

type GetTournamentPlayersData = z.infer<typeof getTournamentPlayersRequestSchema.shape.query>;

type GetTournamentLeaderboardData = z.infer<typeof getTournamentLeaderboardRequestSchema.shape.query>;

type GetAllTournamentsData = z.infer<typeof getAllTournamentsRequestSchema.shape.query>;

type TournamentNormal = ObjectWithTournamentIdOnly & 
                  z.infer<typeof tournamentRequestSchema> &
                  BaseModelTimestamps;

type TournamentResult = z.infer<typeof tournamentResultRequestSchema> &
                    { createdAt: Date; };

type PlayerTournamentWithResult = TournamentNormal & {
    playerResultIndex: number;
};


export {
    NewTournamentData,
    PatchTournamentData,
    GetTournamentGamesData,
    GetTournamentPlayersData,
    TournamentNormal,
    GetAllTournamentsData,
    TournamentResult,
    PlayerTournamentWithResult,
    GetTournamentLeaderboardData,
}
