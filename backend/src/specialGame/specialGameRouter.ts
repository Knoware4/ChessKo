import { Router } from 'express';
import { createNewSpecialGame, patchSpecialGame, deleteSpecialGame,
    getAllSpecialGames, getSpecialGameById, getSpecialGameGames,
    getSpecialGamePlayers, getSpecialGameLeaderboard,
} from './specialGameController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';


const specialGameRouter = Router();

specialGameRouter.post('/', authenticate, authorize(["ADMIN"]), createNewSpecialGame);
specialGameRouter.patch('/:specialGameId', authenticate, authorize(["ADMIN"]), patchSpecialGame);
specialGameRouter.delete('/:specialGameId', authenticate, authorize(["ADMIN"]), deleteSpecialGame);

specialGameRouter.get('/', authenticate, authorize(["USER", "ADMIN"]), getAllSpecialGames);
specialGameRouter.get('/:specialGameId', authenticate, authorize(["USER", "ADMIN"]), getSpecialGameById);
specialGameRouter.get('/:specialGameId/games', authenticate, authorize(["USER", "ADMIN"]), getSpecialGameGames);
specialGameRouter.get('/:specialGameId/players', authenticate, authorize(["USER", "ADMIN"]), getSpecialGamePlayers);
specialGameRouter.get('/:specialGameId/leaderboard', authenticate, authorize(["USER", "ADMIN"]), getSpecialGameLeaderboard);

export default specialGameRouter;
