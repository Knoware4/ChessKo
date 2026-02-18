import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
    GameMode,
    MatchType,
    TimeControl,
    GameStatus,
    GameResult,
    Role,
    Color,
    VariantKey,
    UpgradeKey,
} from '@prisma/client';

import { getMultipleModelsSchema } from '../generalValidationSchemas';
import {
    createNewPlayerRequestSchema,
    deletePlayerRequestSchema,
    getPlayerByEmailRequestSchema,
    getPlayerGamesRequestSchema,
    getPlayerTournamentsRequestSchema,
    getPlayerRequestSchema,
    patchPlayerRequestSchema,
    getPlayerSavedConfigurationsRequestSchema,
    getPlayerSpecialGamesRequestSchema,
} from '../player/validationSchemas/RESTValidationSchemas';
import {
    createNewGameRequestSchema,
    deleteGameRequestSchema,
    getAllGamesRequestSchema,
    getGameRequestSchema,
    patchGameRequestSchema,
} from '../game/validationSchemas/RESTValidationSchemas';
import {
    createNewTournamentRequestSchema,
    deleteTournamentRequestSchema,
    getAllTournamentsRequestSchema,
    getTournamentGamesRequestSchema,
    getTournamentPlayersRequestSchema,
    getTournamentRequestSchema,
    patchTournamentRequestSchema,
    getTournamentLeaderboardRequestSchema,
} from '../tournament/validationSchemas/RESTValidationSchemas';
import {
    createNewSpecialGameRequestSchema,
    deleteSpecialGameRequestSchema,
    getAllSpecialGamesRequestSchema,
    getSpecialGameGamesRequestSchema,
    getSpecialGamePlayersRequestSchema,
    getSpecialGameRequestSchema,
    patchSpecialGameRequestSchema,
    createNewSpecialConfigurationRequestSchema,
    getSpecialGameLeaderboardRequestSchema,
    specialGameResultRequestSchema,
} from '../specialGame/validationSchemas/RESTValidationSchemas';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const MessageSchema = registry.register('Message', z.object({
    message: z.string().openapi({ example: 'OK' }).optional(),
}));
const PaginationSchema = registry.register('Pagination', z.object({
    currentPage: z.number().int().openapi({ example: 1 }),
    pageSize: z.number().int().openapi({ example: 10 }),
    totalPages: z.number().int().openapi({ example: 5 }),
    totalItemCount: z.number().int().openapi({ example: 42 }),
}));

const ErrorResponseSchema = registry.register('ErrorResponse', MessageSchema.extend({
    error: z.string().openapi({ example: 'Bad Request' }).optional(),
}));

const BadRequestResponse = {
    description: 'Bad Request',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
} as const;
const NotFoundResponse = {
    description: 'Resource not found',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
} as const;
const ConflictResponse = {
    description: 'Conflict',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
} as const;
const InternalErrorResponse = {
    description: 'Internal server error',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
} as const;

registry.registerComponent('responses', 'BadRequest', BadRequestResponse);
registry.registerComponent('responses', 'NotFound', NotFoundResponse);
registry.registerComponent('responses', 'Conflict', ConflictResponse);
registry.registerComponent('responses', 'InternalError', InternalErrorResponse);

registry.register('GameMode', z.nativeEnum(GameMode));
registry.register('MatchType', z.nativeEnum(MatchType));
registry.register('TimeControl', z.nativeEnum(TimeControl));
registry.register('GameStatus', z.nativeEnum(GameStatus));
registry.register('GameResult', z.nativeEnum(GameResult));
registry.register('Role', z.nativeEnum(Role));
registry.register('Color', z.nativeEnum(Color));
registry.register('VariantKey', z.nativeEnum(VariantKey));
registry.register('UpgradeKey', z.nativeEnum(UpgradeKey));

const playerSharedStats = {
    eloRankedBlitz: z.number().int(),
    eloSpecialBlitz: z.number().int(),
    eloRankedBullet: z.number().int(),
    eloSpecialBullet: z.number().int(),
    eloRankedRapid: z.number().int(),
    eloSpecialRapid: z.number().int(),
    eloRankedClassic: z.number().int(),
    eloSpecialClassic: z.number().int(),
    eloRankedUnlimited: z.number().int(),
    eloSpecialUnlimited: z.number().int(),
};
const PlayerLessBaseSchema = z.object({
    id: z.string().uuid(),
    nickname: z.string(),
    ...playerSharedStats,
    ongoingGameId: z.string().uuid().nullable().optional(),
    ongoingTournamentId: z.string().uuid().nullable().optional(),
    ongoingSpecialGameId: z.string().uuid().nullable().optional(),
    createdAt: z.string().datetime({ offset: true }),
    editedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
});
const PlayerLessSchema = registry.register('PlayerLess', PlayerLessBaseSchema);
const PlayerNormalBaseSchema = PlayerLessBaseSchema.extend({
    email: z.string().email(),
    role: z.string(),
});
const PlayerNormalSchema = registry.register('PlayerNormal', PlayerNormalBaseSchema);
const PlayerCreateSchema = registry.register('PlayerCreate', createNewPlayerRequestSchema.shape.body);
const PlayerUpdateSchema = registry.register('PlayerUpdate', patchPlayerRequestSchema.shape.body);

const SinglePlayerResponse = registry.register('SinglePlayerResponse', MessageSchema.extend({ item: PlayerNormalSchema }));
const MultiPlayerLessResponse = registry.register('MultiPlayerLessResponse', MessageSchema.extend({ items: z.array(PlayerLessSchema) }));
const PaginatedPlayerLessResponse = registry.register(
    'PaginatedPlayerLessResponse',
    MultiPlayerLessResponse.extend({ pagination: PaginationSchema }),
);
const MultiPlayerNormalResponse = registry.register(
    'MultiPlayerNormalResponse',
    MessageSchema.extend({ items: z.array(PlayerNormalSchema) }),
);
const PaginatedPlayerNormalResponse = registry.register(
    'PaginatedPlayerNormalResponse',
    MultiPlayerNormalResponse.extend({ pagination: PaginationSchema }),
);

const SpecialConfigurationBaseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    variantKey: z.nativeEnum(VariantKey),
    upgradeKeys: z.array(z.nativeEnum(UpgradeKey)),
});
const SpecialConfigurationSchema = registry.register('SpecialConfiguration', SpecialConfigurationBaseSchema);
const SpecialConfigurationCreateSchema = registry.register(
    'SpecialConfigurationCreate',
    createNewSpecialConfigurationRequestSchema.shape.body,
);
const MultiSpecialConfigurationResponse = registry.register(
    'MultiSpecialConfigurationResponse',
    MessageSchema.extend({ items: z.array(SpecialConfigurationSchema) }),
);
const PaginatedSpecialConfigurationResponse = registry.register(
    'PaginatedSpecialConfigurationResponse',
    MultiSpecialConfigurationResponse.extend({ pagination: PaginationSchema }),
);

const GamePlayerBaseSchema = PlayerLessBaseSchema.extend({
    email: z.string().email(),
    role: z.string(),
});
const GamePlayerSchema = registry.register('GamePlayer', GamePlayerBaseSchema);
const GameBaseSchema = z.object({
    id: z.string().uuid(),
    gameMode: z.string(),
    matchType: z.string(),
    timeControl: z.string(),
    tcMinutes: z.number().int(),
    tcBonus: z.number().int(),
    gameStatus: z.string(),
    gameResult: z.string().nullable().optional(),
    whitePlayer: GamePlayerSchema,
    blackPlayer: GamePlayerSchema,
    whiteEloBefore: z.number().int(),
    blackEloBefore: z.number().int(),
    whiteEloAfter: z.number().int().nullable().optional(),
    blackEloAfter: z.number().int().nullable().optional(),
    pgn: z.string().nullable().optional(),
    startedAt: z.string().datetime({ offset: true }).nullable().optional(),
    finishedAt: z.string().datetime({ offset: true }).nullable().optional(),
    tournamentId: z.string().uuid().nullable().optional(),
    tournamentRoundIndex: z.number().int().nullable().optional(),
    specialConfiguration: SpecialConfigurationSchema,
    createdAt: z.string().datetime({ offset: true }),
    editedAt: z.string().datetime({ offset: true }),
});
const GameSchema = registry.register('Game', GameBaseSchema);
const GameCreateSchema = registry.register('GameCreate', createNewGameRequestSchema.shape.body);
const GameUpdateSchema = registry.register('GameUpdate', patchGameRequestSchema.shape.body);
const SingleGameResponse = registry.register('SingleGameResponse', MessageSchema.extend({ item: GameSchema }));
const MultiGameResponse = registry.register('MultiGameResponse', MessageSchema.extend({ items: z.array(GameSchema) }));
const PaginatedGameResponse = registry.register(
    'PaginatedGameResponse',
    MultiGameResponse.extend({ pagination: PaginationSchema }),
);

const TournamentBaseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    gameMode: z.string(),
    timeControl: z.string(),
    tcMinutes: z.number().int(),
    tcBonus: z.number().int(),
    ownerId: z.string().uuid(),
    winnerId: z.string().uuid().nullable().optional(),
    startedAt: z.string().datetime({ offset: true }).nullable().optional(),
    finishedAt: z.string().datetime({ offset: true }).nullable().optional(),
    createdAt: z.string().datetime({ offset: true }),
    editedAt: z.string().datetime({ offset: true }),
});

const TournamentResultBaseSchema = z.object({
    id: z.string().uuid(),
    player: PlayerNormalSchema,
    tournament: TournamentBaseSchema,
    resultIndex: z.number().int(),
    roundIndex: z.number().int(),
    score: z.number(),
    createdAt: z.string().datetime({ offset: true }),
});

const TournamentSchema = registry.register('Tournament', TournamentBaseSchema);
const TournamentCreateSchema = registry.register('TournamentCreate', createNewTournamentRequestSchema.shape.body);
const TournamentUpdateSchema = registry.register('TournamentUpdate', patchTournamentRequestSchema.shape.body);
const TournamentResultSchema = registry.register('TournamentResult', TournamentResultBaseSchema);
const PlayerTournamentSchema = registry.register(
    'PlayerTournament',
    TournamentBaseSchema.extend({
        playerResultIndex: z.number().int().nullable().optional(),
    }),
);
const SingleTournamentResponse = registry.register('SingleTournamentResponse', MessageSchema.extend({ item: TournamentSchema }));
const MultiTournamentResponse = registry.register(
    'MultiTournamentResponse',
    MessageSchema.extend({ items: z.array(TournamentSchema) }),
);
const PaginatedTournamentResponse = registry.register(
    'PaginatedTournamentResponse',
    MultiTournamentResponse.extend({ pagination: PaginationSchema }),
);
const MultiPlayerTournamentResponse = registry.register(
    'MultiPlayerTournamentResponse',
    MessageSchema.extend({ items: z.array(PlayerTournamentSchema) }),
);
const PaginatedPlayerTournamentResponse = registry.register(
    'PaginatedPlayerTournamentResponse',
    MultiPlayerTournamentResponse.extend({ pagination: PaginationSchema }),
);
const MultiTournamentResultResponse = registry.register(
    'MultiTournamentResultResponse',
    MessageSchema.extend({ items: z.array(TournamentResultSchema) }),
);
const PaginatedTournamentResultResponse = registry.register(
    'PaginatedTournamentResultResponse',
    MultiTournamentResultResponse.extend({ pagination: PaginationSchema }),
);

const SpecialGameBaseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    matchType: z.string(),
    timeControl: z.string(),
    tcMinutes: z.number().int(),
    tcBonus: z.number().int(),
    owner: PlayerNormalSchema,
    winner: PlayerNormalSchema.nullable().optional(),
    startedAt: z.string().datetime({ offset: true }).nullable().optional(),
    finishedAt: z.string().datetime({ offset: true }).nullable().optional(),
    currentRoundIndex: z.number().int().nullable().optional(),
    totalRounds: z.number().int().nullable().optional(),
    numberOfPlayers: z.number().int(),
    specialConfiguration: SpecialConfigurationSchema,
    createdAt: z.string().datetime({ offset: true }),
    editedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const SpecialGameSchema = registry.register('SpecialGame', SpecialGameBaseSchema);
const PlayerSpecialGameSchema = registry.register(
    'PlayerSpecialGame',
    SpecialGameBaseSchema.extend({
        playerResultIndex: z.number().int().nullable().optional(),
    }),
);
const SpecialGameCreateSchema = registry.register('SpecialGameCreate', createNewSpecialGameRequestSchema.shape.body);
const SpecialGameUpdateSchema = registry.register('SpecialGameUpdate', patchSpecialGameRequestSchema.shape.body);
const SingleSpecialGameResponse = registry.register('SingleSpecialGameResponse', MessageSchema.extend({ item: SpecialGameSchema }));
const MultiSpecialGameResponse = registry.register(
    'MultiSpecialGameResponse',
    MessageSchema.extend({ items: z.array(SpecialGameSchema) }),
);
const PaginatedSpecialGameResponse = registry.register(
    'PaginatedSpecialGameResponse',
    MultiSpecialGameResponse.extend({ pagination: PaginationSchema }),
);
const MultiPlayerSpecialGameResponse = registry.register(
    'MultiPlayerSpecialGameResponse',
    MessageSchema.extend({ items: z.array(PlayerSpecialGameSchema) }),
);
const PaginatedPlayerSpecialGameResponse = registry.register(
    'PaginatedPlayerSpecialGameResponse',
    MultiPlayerSpecialGameResponse.extend({ pagination: PaginationSchema }),
);
const SpecialGameResultSchema = registry.register(
    'SpecialGameResult',
    specialGameResultRequestSchema.extend({ createdAt: z.string().datetime({ offset: true }) }),
);
const MultiSpecialGameResultResponse = registry.register(
    'MultiSpecialGameResultResponse',
    MessageSchema.extend({ items: z.array(SpecialGameResultSchema) }),
);
const PaginatedSpecialGameResultResponse = registry.register(
    'PaginatedSpecialGameResultResponse',
    MultiSpecialGameResultResponse.extend({ pagination: PaginationSchema }),
);

const unionWithPagination = <T extends z.ZodTypeAny>(nonPaginated: T, paginated: z.ZodTypeAny) =>
    z.union([nonPaginated, paginated]);

registry.registerPath({
    method: 'post',
    path: '/players',
    tags: ['Players'],
    summary: 'Create a new player',
    request: {
        body: {
            content: {
                'application/json': { schema: PlayerCreateSchema },
            },
        },
    },
    responses: {
        201: { description: 'Player created', content: { 'application/json': { schema: SinglePlayerResponse } } },
        400: BadRequestResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/user',
    tags: ['Players'],
    summary: 'Get all players with less attributes',
    request: {
        query: getMultipleModelsSchema.shape.query,
    },
    responses: {
        200: {
            description: 'A list of players',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiPlayerLessResponse, PaginatedPlayerLessResponse),
                },
            },
        },
        400: BadRequestResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/admin',
    tags: ['Players'],
    summary: 'Get all players with complete attributes',
    request: {
        query: getMultipleModelsSchema.shape.query,
    },
    responses: {
        200: {
            description: 'A list of players',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiPlayerNormalResponse, PaginatedPlayerNormalResponse),
                },
            },
        },
        400: BadRequestResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/{playerId}',
    tags: ['Players'],
    summary: 'Get player by ID',
    request: {
        params: getPlayerRequestSchema.shape.params,
    },
    responses: {
        200: { description: 'Player found', content: { 'application/json': { schema: SinglePlayerResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'patch',
    path: '/players/{playerId}',
    tags: ['Players'],
    summary: 'Patch player by ID',
    request: {
        params: getPlayerRequestSchema.shape.params,
        body: {
            content: {
                'application/json': { schema: PlayerUpdateSchema },
            },
        },
    },
    responses: {
        200: { description: 'Player updated', content: { 'application/json': { schema: SinglePlayerResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'delete',
    path: '/players/{playerId}',
    tags: ['Players'],
    summary: 'Delete player by ID',
    request: {
        params: deletePlayerRequestSchema.shape.params,
    },
    responses: {
        204: { description: 'Player deleted' },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/email/{playerEmail}',
    tags: ['Players'],
    summary: 'Get player by email',
    request: {
        params: getPlayerByEmailRequestSchema.shape.params,
    },
    responses: {
        200: { description: 'Player found', content: { 'application/json': { schema: SinglePlayerResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/{playerId}/games',
    tags: ['Players'],
    summary: "Get games of a player",
    request: {
        params: getPlayerGamesRequestSchema.shape.params,
        query: getPlayerGamesRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: "List of player's games",
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiGameResponse, PaginatedGameResponse),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/{playerId}/tournaments',
    tags: ['Players'],
    summary: "Get tournaments of a player",
    request: {
        params: getPlayerTournamentsRequestSchema.shape.params,
        query: getPlayerTournamentsRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: "List of player's tournaments",
            content: {
                'application/json': {
                    schema: unionWithPagination(
                        MultiPlayerTournamentResponse,
                        PaginatedPlayerTournamentResponse,
                    ),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/{playerId}/specialGames',
    tags: ['Players'],
    summary: "Get special games of a player",
    request: {
        params: getPlayerSpecialGamesRequestSchema.shape.params,
        query: getPlayerSpecialGamesRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: "List of player's special games",
            content: {
                'application/json': {
                    schema: unionWithPagination(
                        MultiPlayerSpecialGameResponse,
                        PaginatedPlayerSpecialGameResponse,
                    ),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/players/{playerId}/configurations',
    tags: ['Players'],
    summary: "Get saved special configurations of a player",
    request: {
        params: getPlayerSavedConfigurationsRequestSchema.shape.params,
        query: getPlayerSavedConfigurationsRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: "List of player's saved configurations",
            content: {
                'application/json': {
                    schema: unionWithPagination(
                        MultiSpecialConfigurationResponse,
                        PaginatedSpecialConfigurationResponse,
                    ),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/games',
    tags: ['Games'],
    summary: 'Get all games',
    request: {
        query: getAllGamesRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'A list of games',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiGameResponse, PaginatedGameResponse),
                },
            },
        },
        400: BadRequestResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'post',
    path: '/games',
    tags: ['Games'],
    summary: 'Create a new game',
    request: {
        body: {
            content: {
                'application/json': { schema: GameCreateSchema },
            },
        },
    },
    responses: {
        201: { description: 'Game created', content: { 'application/json': { schema: SingleGameResponse } } },
        400: BadRequestResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/games/{gameId}',
    tags: ['Games'],
    summary: 'Get game by ID',
    request: { params: getGameRequestSchema.shape.params },
    responses: {
        200: { description: 'Game found', content: { 'application/json': { schema: SingleGameResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'patch',
    path: '/games/{gameId}',
    tags: ['Games'],
    summary: 'Patch game by ID',
    request: {
        params: getGameRequestSchema.shape.params,
        body: {
            content: {
                'application/json': { schema: GameUpdateSchema },
            },
        },
    },
    responses: {
        200: { description: 'Game updated', content: { 'application/json': { schema: SingleGameResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'delete',
    path: '/games/{gameId}',
    tags: ['Games'],
    summary: 'Delete game by ID',
    request: { params: deleteGameRequestSchema.shape.params },
    responses: {
        204: { description: 'Game deleted' },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/specialGames',
    tags: ['SpecialGames'],
    summary: 'Get all special games',
    request: {
        query: getAllSpecialGamesRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'A list of special games',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiSpecialGameResponse, PaginatedSpecialGameResponse),
                },
            },
        },
        400: BadRequestResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'post',
    path: '/specialGames',
    tags: ['SpecialGames'],
    summary: 'Create a new special game',
    request: {
        body: {
            content: {
                'application/json': { schema: SpecialGameCreateSchema },
            },
        },
    },
    responses: {
        201: { description: 'Special game created', content: { 'application/json': { schema: SingleSpecialGameResponse } } },
        400: BadRequestResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/specialGames/{specialGameId}',
    tags: ['SpecialGames'],
    summary: 'Get special game by ID',
    request: { params: getSpecialGameRequestSchema.shape.params },
    responses: {
        200: { description: 'Special game found', content: { 'application/json': { schema: SingleSpecialGameResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'patch',
    path: '/specialGames/{specialGameId}',
    tags: ['SpecialGames'],
    summary: 'Patch special game by ID',
    request: {
        params: getSpecialGameRequestSchema.shape.params,
        body: {
            content: {
                'application/json': { schema: SpecialGameUpdateSchema },
            },
        },
    },
    responses: {
        200: { description: 'Special game updated', content: { 'application/json': { schema: SingleSpecialGameResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'delete',
    path: '/specialGames/{specialGameId}',
    tags: ['SpecialGames'],
    summary: 'Delete special game by ID',
    request: { params: deleteSpecialGameRequestSchema.shape.params },
    responses: {
        204: { description: 'Special game deleted' },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/specialGames/{specialGameId}/games',
    tags: ['SpecialGames'],
    summary: 'Get games of a special game',
    request: {
        params: getSpecialGameGamesRequestSchema.shape.params,
        query: getSpecialGameGamesRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'List of special game games',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiGameResponse, PaginatedGameResponse),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/specialGames/{specialGameId}/players',
    tags: ['SpecialGames'],
    summary: 'Get players of a special game',
    request: {
        params: getSpecialGamePlayersRequestSchema.shape.params,
        query: getSpecialGamePlayersRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'List of special game players',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiPlayerNormalResponse, PaginatedPlayerNormalResponse),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/specialGames/{specialGameId}/leaderboard',
    tags: ['SpecialGames'],
    summary: 'Get leaderboard of a special game (optionally for a specific round)',
    request: {
        params: getSpecialGameLeaderboardRequestSchema.shape.params,
        query: getSpecialGameLeaderboardRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'List of special game leaderboard entries',
            content: {
                'application/json': {
                    schema: unionWithPagination(
                        MultiSpecialGameResultResponse,
                        PaginatedSpecialGameResultResponse,
                    ),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/tournaments',
    tags: ['Tournaments'],
    summary: 'Get all tournaments',
    request: {
        query: getAllTournamentsRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'A list of tournaments',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiTournamentResponse, PaginatedTournamentResponse),
                },
            },
        },
        400: BadRequestResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'post',
    path: '/tournaments',
    tags: ['Tournaments'],
    summary: 'Create a new tournament',
    request: {
        body: {
            content: {
                'application/json': { schema: TournamentCreateSchema },
            },
        },
    },
    responses: {
        201: { description: 'Tournament created', content: { 'application/json': { schema: SingleTournamentResponse } } },
        400: BadRequestResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/tournaments/{tournamentId}',
    tags: ['Tournaments'],
    summary: 'Get tournament by ID',
    request: { params: getTournamentRequestSchema.shape.params },
    responses: {
        200: { description: 'Tournament found', content: { 'application/json': { schema: SingleTournamentResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'patch',
    path: '/tournaments/{tournamentId}',
    tags: ['Tournaments'],
    summary: 'Patch tournament by ID',
    request: {
        params: getTournamentRequestSchema.shape.params,
        body: {
            content: {
                'application/json': { schema: TournamentUpdateSchema },
            },
        },
    },
    responses: {
        200: { description: 'Tournament updated', content: { 'application/json': { schema: SingleTournamentResponse } } },
        400: BadRequestResponse,
        404: NotFoundResponse,
        409: ConflictResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'delete',
    path: '/tournaments/{tournamentId}',
    tags: ['Tournaments'],
    summary: 'Delete tournament by ID',
    request: { params: deleteTournamentRequestSchema.shape.params },
    responses: {
        204: { description: 'Tournament deleted' },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/tournaments/{tournamentId}/games',
    tags: ['Tournaments'],
    summary: 'Get games of a tournament',
    request: {
        params: getTournamentGamesRequestSchema.shape.params,
        query: getTournamentGamesRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'List of tournament games',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiGameResponse, PaginatedGameResponse),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/tournaments/{tournamentId}/players',
    tags: ['Tournaments'],
    summary: 'Get players of a tournament',
    request: {
        params: getTournamentPlayersRequestSchema.shape.params,
        query: getTournamentPlayersRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'List of tournament players',
            content: {
                'application/json': {
                    schema: unionWithPagination(MultiPlayerNormalResponse, PaginatedPlayerNormalResponse),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/tournaments/{tournamentId}/leaderboard',
    tags: ['Tournaments'],
    summary: 'Get leaderboard of a tournament (optionally for a specific round)',
    request: {
        params: getTournamentLeaderboardRequestSchema.shape.params,
        query: getTournamentLeaderboardRequestSchema.shape.query,
    },
    responses: {
        200: {
            description: 'List of tournament leaderboard entries',
            content: {
                'application/json': {
                    schema: unionWithPagination(
                        MultiTournamentResultResponse,
                        PaginatedTournamentResultResponse,
                    ),
                },
            },
        },
        400: BadRequestResponse,
        404: NotFoundResponse,
        500: InternalErrorResponse,
    },
});

export const generateOpenApiDocument = () => {
    const generator = new OpenApiGeneratorV3(registry.definitions);
    return generator.generateDocument({
        openapi: '3.1.0',
        info: {
            title: 'Chess Platform REST API',
            version: '2.0.0',
            description: 'REST API for a chess platform (Players, Games, Tournaments, Special Games).',
        },
        servers: [
            {
                url: 'http://localhost:8080',
                description: 'Local development server',
            },
        ],
        tags: [
            { name: 'Players' },
            { name: 'Games' },
            { name: 'SpecialGames' },
            { name: 'Tournaments' },
        ],
    });
};
