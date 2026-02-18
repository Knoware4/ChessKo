import { useContext, useEffect, useState } from "react";
import { MatchTypeButton } from "../buttons/matchTypeButton"
import { TimeControlSelector } from "./timeControlSelector"
import { PlayButton } from "../buttons/playButton";
import { FormProvider, useForm } from "react-hook-form";
import { GameFoundPayload, SearchGamePayload } from "../sockets/socketPayloads";
import { Context } from "../App";
import { SocketEvent } from "../sockets/socketEvents";
import { useNavigate } from "react-router-dom";
import { CreateGameFormType } from "../types/forms/createGameForm";
import { SearchingWindow } from "../components/windows/SearchingWindow";


export const CreateGame = () => {
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const createGameForm = useForm<CreateGameFormType>({
        defaultValues: {
            gameMode: "CLASSIC",
        },
    });
    const { socket, player } = useContext(Context);

    const options = [
        {
            name: "Bullet",
            options: [
                {
                    minutes: 1,
                    bonus: 0,
                },
                {
                    minutes: 1,
                    bonus: 1,
                },
                {
                    minutes: 2,
                    bonus: 0,
                },
                {
                    minutes: 2,
                    bonus: 1,
                }],
        },
        {
            name: "Blitz",
            options: [
                {
                    minutes: 3,
                    bonus: 0,
                },
                {
                    minutes: 3,
                    bonus: 2,
                },
                {
                    minutes: 5,
                    bonus: 0,
                },
                {
                    minutes: 5,
                    bonus: 3,
                },
            ],
        },
        {
            name: "Rapid",
            options: [
                {
                    minutes: 10,
                    bonus: 0,
                },
                {
                    minutes: 10,
                    bonus: 5,
                },
                {
                    minutes: 15,
                    bonus: 0,
                },
                {
                    minutes: 15,
                    bonus: 5,
                },
            ],

        },
        {
            name: "Classic",
            options: [
                {
                    minutes: 60,
                    bonus: 0,
                },
                {
                    minutes: 60,
                    bonus: 30,
                },
                {
                    minutes: 90,
                    bonus: 0,
                },
                {
                    minutes: 90,
                    bonus: 30,
                },
            ],

        }
    ]

    function searchGame(data: CreateGameFormType) {
        if (data.gameMode && data.matchType && data.timeControl) {
            setIsSearching(true);
            if (socket) {
                const payload: SearchGamePayload = {
                    socketId: socket.id!,
                    gameMode: data.gameMode,
                    matchType: data.matchType,
                    playerId: player!.id,
                    tcBonus: data.timeControl.bonus,
                    tcMinutes: data.timeControl.minutes
                }
                socket?.emit(SocketEvent.SEARCH_GAME, payload);
            }
        }
    }

    const navigate = useNavigate();

    useEffect(() => {
        function onGameFound(payload: GameFoundPayload) {
            console.log("🎮 game_was_found:", payload);
            navigate("/games/" + payload.gameId);
        }

        socket?.on(SocketEvent.GAME_FOUND, onGameFound);

        return () => {
            socket?.off(SocketEvent.GAME_FOUND, onGameFound);
        };
    }, [navigate, socket]);


    return (
        <div>
            {
                isSearching &&
                <FormProvider {...createGameForm}>
                    <SearchingWindow setIsSearching={setIsSearching} />
                </FormProvider>
            }
            <form onSubmit={createGameForm.handleSubmit(searchGame)}>
                <FormProvider {...createGameForm}>
                    <div
                        className="flex justify-center">
                        <MatchTypeButton />
                    </div>
                    <div
                        className="flex flex-col items-center gap-3 mt-3">
                        {
                            options.map((option, key) => (
                                <TimeControlSelector key={key} options={option.options} timeControl={option.name} />
                            ))
                        }
                    </div>
                    <div
                        className="flex justify-center mt-4">
                        <PlayButton />
                    </div>
                </FormProvider>
            </form>
        </div>
    )
}
