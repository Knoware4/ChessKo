import { Router } from 'express';
import { createNewTournament, patchTournament, deleteTournament,
    getAllTournaments, getTournamentById, getTournamentGames,
    getTournamentPlayers, getTournamentLeaderboard,
} from './tournamentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';


const tournamentRouter = Router();

tournamentRouter.post('/', authenticate, authorize(["ADMIN"]), createNewTournament);
tournamentRouter.patch('/:tournamentId', authenticate, authorize(["ADMIN"]), patchTournament);
tournamentRouter.delete('/:tournamentId', authenticate, authorize(["ADMIN"]), deleteTournament);

tournamentRouter.get('/', authenticate, authorize(["USER", "ADMIN"]), getAllTournaments);
tournamentRouter.get('/:tournamentId', authenticate, authorize(["USER", "ADMIN"]), getTournamentById);
tournamentRouter.get('/:tournamentId/games', authenticate, authorize(["USER", "ADMIN"]), getTournamentGames);
tournamentRouter.get('/:tournamentId/players', authenticate, authorize(["USER", "ADMIN"]), getTournamentPlayers);
tournamentRouter.get('/:tournamentId/leaderboard', authenticate, authorize(["USER", "ADMIN"]), getTournamentLeaderboard);

export default tournamentRouter;
