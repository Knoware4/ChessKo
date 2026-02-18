import { useContext } from "react";
import { Login } from "../header/login";
import { Context } from "../App";
import { ReturnToTheGameButton } from "../buttons/returnToTheGameButton";
import { CreateGame } from "../home/createGame";


export const Home = () => {
    const { firebaseUser, player } = useContext(Context);

    return (
        <div
            className="flex flex-col bg-gray-100 min-h-screen py-10">
            {!firebaseUser && (
                <div
                    className="flex flex-1 items-center justify-center">
                    <Login />
                </div>
            )}
            {firebaseUser && !player?.ongoingGameId && (
                <div>
                    <div
                        className="text-3xl text-primary font-semibold text-center">
                        Classic Chess
                    </div>
                    <div
                        className="flex justify-center mt-5">
                        <div
                            className="flex flex-col gap-6 p-8 rounded-xl shadow-lg bg-white">
                            <CreateGame />
                        </div>
                    </div>
                </div>
            )}
            {firebaseUser && player?.ongoingGameId && (
                <div
                    className="px-4 flex justify-center">
                    <div
                        className="mx-auto w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
                        <ReturnToTheGameButton gameId={player.ongoingGameId} />
                    </div>
                </div>
            )}
        </div>
    );
};
