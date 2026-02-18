import { useParams } from "react-router-dom";
import { usePlayer, usePlayerConfigurations, usePlayerSpecialGames } from "../hooks/usePlayer";
import { usePlayersGames } from "../hooks/useGame";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { usePlayersTournaments } from "../hooks/useTournament";
import { ProfileHeader } from "../userPageComponents/profileHeader";
import { GamesList } from "../userPageComponents/gamesList";
import { Trophies } from "../userPageComponents/trophies";
import { SpecialGamesList } from "../userPageComponents/specialGamesList";
import { TournamentsList } from "../userPageComponents/tournamentsList";
import { UserSpecialConfigs } from "../userPageComponents/userSpecialConfigs";


export const UserPage = () => {
    const { id } = useParams<{ id: string }>();

    const { data: player, isLoading: isLoadingPlayer, error: playerError } = usePlayer(id);
    const { data: games, isLoading: isLoadingGames, error: errorGames } = usePlayersGames(id);
    const { data: tournaments, isLoading: isLoadingTournaments, error: errorTournaments } = usePlayersTournaments(id);
    const { data: specialGames, isLoading: isLoadingSpecialGames, error: errorSpecialGames } = usePlayerSpecialGames(id);
    const { data: specialConfigurations, isLoading: isLoadingSpecialConfiguration, error: errorSpecialConfiguration } = usePlayerConfigurations(id);

    if (isLoadingPlayer || !specialConfigurations || isLoadingSpecialConfiguration || !player || !games || isLoadingGames || isLoadingTournaments || !tournaments || !specialGames || isLoadingSpecialGames) return <Loading />
    if (playerError || errorGames || errorTournaments || errorSpecialGames || errorSpecialConfiguration) return <Error />

    return (
        <div
            className="flex flex-col items-center justify-center space-y-10 mt-6 mb-3">
            <ProfileHeader player={player} />
            <hr className="border-t-2 border-gray-400 my-4 w-full" />
            <GamesList games={games} />
            <hr className="border-t-2 border-gray-400 my-4 w-full" />
            <Trophies tournaments={tournaments} />
            <hr className="border-t-2 border-gray-400 my-4 w-full" />
            <TournamentsList tournaments={tournaments} />
            <hr className="border-t-2 border-gray-400 my-4 w-full" />
            <SpecialGamesList specialGames={specialGames} />
            <hr className="border-t-2 border-gray-400 my-4 w-full" />
            <UserSpecialConfigs configurations={specialConfigurations} />
        </div>
    )
}
