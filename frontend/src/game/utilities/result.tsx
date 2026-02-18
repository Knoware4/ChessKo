interface ResultProps {
    result: 0 | 1 | 0.5 | undefined
}


export const Result = ({ result }: ResultProps) => {
    const color = result === 0 ? "text-red-700" : result === 1 ? "text-green-700" : "text-black-700";

    return (
        <div
            className={`flex items-center px-2 ${color}`}>
            {result}
        </div>
    )
}
