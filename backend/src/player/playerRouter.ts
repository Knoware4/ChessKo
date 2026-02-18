import { Router } from 'express';
import { createNewPlayer, patchPlayer, deletePlayer, getPlayerById,
    getPlayerGames, getPlayerByEmail, getAllPlayersNormal, getAllPlayersLess,
    getPlayerTournaments, getPlayerSpecialGames, getPlayerSavedConfigurations,
} from './playerController';
import { authenticate, registerAuthenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';


const playerRouter = Router();

playerRouter.post('/', registerAuthenticate, createNewPlayer);
playerRouter.patch('/:playerId', authenticate, authorize(["ADMIN"]), patchPlayer);
playerRouter.delete('/:playerId', authenticate, authorize(["ADMIN"]), deletePlayer);

playerRouter.get('/admin', authenticate, authorize(["ADMIN"]), getAllPlayersNormal);
playerRouter.get('/user', authenticate, authorize(["USER", "ADMIN"]), getAllPlayersLess)

playerRouter.get('/email/:playerEmail', authenticate, authorize(["USER", "ADMIN"]), getPlayerByEmail);
playerRouter.get('/:playerId', authenticate, authorize(["USER", "ADMIN"]), getPlayerById);
playerRouter.get('/:playerId/games', authenticate, authorize(["USER", "ADMIN"]), getPlayerGames);
playerRouter.get('/:playerId/tournaments', authenticate, authorize(["USER", "ADMIN"]), getPlayerTournaments);
playerRouter.get('/:playerId/specialGames', authenticate, authorize(["USER", "ADMIN"]), getPlayerSpecialGames);
playerRouter.get('/:playerId/configurations', authenticate, authorize(["USER", "ADMIN"]), getPlayerSavedConfigurations);

export default playerRouter;
