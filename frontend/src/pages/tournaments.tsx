import { useContext, useEffect } from "react";
import { Context } from "../App";
import { FormProvider, useForm } from "react-hook-form";
import { TournamentCreatedPayload } from "../sockets/socketPayloads";
import { SocketEvent } from "../sockets/socketEvents";
import { Navigate, useNavigate } from "react-router-dom";
import { useTournaments } from "../hooks/useTournament";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { TournamentRow } from "../tournaments/tournamentRow";
import { CreateTournamentForm } from "../tournaments/createTournamentForm";
import { CreateTournamentFormType } from "../types/forms/tournamentForm";


export const Tournaments = () => {
    const { socket, player } = useContext(Context);
    const createTournamentForm = useForm<CreateTournamentFormType>();

    const { data: tournaments, isLoading, error } = useTournaments();

    const navigate = useNavigate();

    useEffect(() => {
        function tournamentCreated(payload: TournamentCreatedPayload) {
            navigate("/tournaments/" + payload.tournamentId);
        }

        socket?.on(SocketEvent.TOURNAMENT_CREATED, tournamentCreated);

        return () => {
            socket?.off(SocketEvent.TOURNAMENT_CREATED, tournamentCreated);
        };
    });

    if (player?.ongoingGameId) return <Navigate to={`/games/${player.ongoingGameId}`} replace />;
    if (player?.ongoingTournamentId) return <Navigate to={`/tournaments/${player.ongoingTournamentId}`} replace />;

    if (isLoading || !tournaments) return <Loading />
    if (error) return <Error />

    return (
        <div
            className="bg-gray-100 min-h-screen py-10">
            <div
                className="container mx-auto px-4">
                <div
                    className="text-3xl text-primary font-semibold text-center">
                    Tournaments
                </div>
                {
                    !player?.ongoingTournamentId &&
                    <div
                        className="mt-5 mx-auto w-full max-w-3xl">
                        <div
                            className="flex flex-col items-stretch gap-4">
                            {tournaments?.filter((tournament) => !tournament.startedAt).map((tournament, key) => (
                                <TournamentRow tournament={tournament} key={key} />
                            ))}
                        </div>
                    </div>
                }
                {
                    !player?.ongoingTournamentId &&
                    <FormProvider {...createTournamentForm}>
                        <CreateTournamentForm />
                    </FormProvider>
                }
            </div>
        </div>
    );
}
