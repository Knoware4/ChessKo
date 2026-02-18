import { FaTrophy } from "react-icons/fa";


interface LobbyFinishProps {
    winnerName: string | undefined,
}


export const LobbyFinish = ({ winnerName }: LobbyFinishProps) => {
    return (
        <div
            className="bg-gradient-to-b from-gray-50 to-gray-100 py-10">
            <div
                className="container mx-auto px-4">
                <div
                    className="flex items-center justify-center gap-6 rounded-3xl border border-amber-200/60 bg-white/70 px-6 py-6 shadow-xl backdrop-blur">
                    <div
                        className="relative">
                        <FaTrophy
                            className="text-7xl sm:text-8xl md:text-9xl drop-shadow-[0_14px_22px_rgba(0,0,0,0.18)]"
                            style={{
                                color: "#d4af37",
                                filter:
                                    "drop-shadow(0 0 18px rgba(212,175,55,0.55)) drop-shadow(0 4px 0 rgba(0,0,0,0.15))",
                            }}
                        />
                        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl bg-amber-300/40" />
                    </div>

                    <div
                        className="text-center sm:text-left">
                        <div
                            className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-gray-500">
                            TOURNAMENT WINNER
                        </div>
                        <div
                            className="mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
                            {winnerName}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
