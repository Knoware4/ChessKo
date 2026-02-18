import { Router } from 'express';
import { createNewGame, patchGame, deleteGame, getAllGames,
    getGameById,
} from './gameController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';


const gameRouter = Router();

gameRouter.post('/', authenticate, authorize(["ADMIN"]), createNewGame);
gameRouter.patch('/:gameId', authenticate, authorize(["ADMIN"]), patchGame);
gameRouter.delete('/:gameId', authenticate, authorize(["ADMIN"]), deleteGame);

gameRouter.get('/', authenticate, authorize(["USER", "ADMIN"]), getAllGames);
gameRouter.get('/:gameId', authenticate, authorize(["USER", "ADMIN"]), getGameById);


export default gameRouter;
