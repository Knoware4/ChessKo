import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { FaChessBishop } from "react-icons/fa";
import { Game } from "../../types/game";


interface ResultWindowProps {
    result: 0 | 1 | 0.5,
    setShowResultWindow: React.Dispatch<React.SetStateAction<boolean>>,
    refetch: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<Game, Error>>,
}


export const ResultWindow = ({ result, setShowResultWindow, refetch }: ResultWindowProps) => {
    function close() {
        setShowResultWindow(false);
        refetch();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
                className="bg-white rounded-2xl bg-background shadow-lg p-6 flex flex-col items-center gap-3 border border-primary">
                <div
                    className="flex space-x-2 items-center">
                    {
                        result === 1 &&
                        <div
                            className="flex">
                            <FaChessBishop className="w-5 h-5" /><p className="text-primary font-medium">You won!</p>
                        </div>

                    }
                    {
                        result === 0 &&
                        <div
                            className="flex">
                            <FaChessBishop className="w-5 h-5" /><p className="text-primary font-medium">You lost!</p>
                        </div>
                    }
                    {
                        result === 0.5 &&
                        <div
                            className="flex">
                            <FaChessBishop className="w-5 h-5" /><p className="text-primary font-medium">Draw!</p>
                        </div>

                    }
                    <button
                        className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
                        onClick={() => close()}
                        type="button"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}
