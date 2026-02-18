export const Description = () => {
    const variants = [
        {
            name: "Chess960",
            text:  "Fischer Random Chess with randomized back rank setup and Chess960 castling rules.",
        },
        {
            name: "Classical Chess",
            text: "Standard chess rules with traditional starting position.",
        },
        {
            name: "King of the Hill",
            text: "Standard chess rules with an extra win condition: reach the central squares (d4, e4, d5, e5) with your king.",
        },
        {
            name: "Three-check",
            text: "Standard chess rules with an added victory condition: deliver three checks to win.",
        },
    ]

    const upgrades = [
        {
            name: "Extra Turn",
            text: "If charged, grants an extra move immediately after this one unless the move results in checkmate or stalemate.",
        },
        {
            name: "Jump Over",
            text: "Allows queen, rook, and bishop to jump over a single friendly piece to the square immediately beyond if empty.",
        },
        {
            name: "Pawn Dash",
            text: "Allows a pawn to move two squares forward from any position on the board three times a game.",
        },
        {
            name: "Time Check",
            text: "Each time a player moves and checks their opponent, they gain extra time on their clock.",
        }
    ]

    return (
        <div
            className="flex flex-col space-y-5 ">
            <div
                className="flex flex-col space-y-3">
                <div
                    className="font-bold text-2xl">
                    Variants
                </div>
                <div
                    className="flex flex-col space-y-3">
                    {
                        variants.map((variant, key) => (
                            <DescriptionItem name={variant.name} text={variant.text} key={key} />
                        ))
                    }
                </div>
            </div>
            <hr className="border w-full border-black" />
            <div
                className="flex flex-col space-y-3">
                <div
                    className="font-bold text-2xl">
                    Upgrades
                </div>
                <div
                    className="flex flex-col space-y-3">
                    {
                        upgrades.map((upgrade, key) => (
                            <DescriptionItem name={upgrade.name} text={upgrade.text} key={key} />
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

interface DescriptionItemProps {
    name: string,
    text: string,
}


const DescriptionItem = ({ name, text }: DescriptionItemProps) => {
    return (
        <div
            className="flex flex-col space-y-1">
            <div className="font-semibold text-xl">{name}</div>
            <div className="text-md">{text}</div>
        </div>
    )
}
