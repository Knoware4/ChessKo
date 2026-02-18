import { FaExclamationTriangle } from "react-icons/fa";


interface CanceledProps {
    text: string,
}


export const Canceled = ({ text }: CanceledProps) => {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center space-x-2 text-primary font-bold">
            <div
                className="flex items-center justify-center space-x-2 text-primary font-bold">
                <div>
                    {text}
                </div>
                <FaExclamationTriangle className="w-10 h-10 text-primary" />
            </div>
        </div>
    )
}
