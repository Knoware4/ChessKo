import { Loader2 } from "lucide-react";


interface LoadingProps {
    text?: string,
    full?: boolean
}


export const Loading = ({ text = "Loading", full = true }: LoadingProps) => {
    return (
        <div 
            className={`${full ? "min-h-screen" : ""} flex items-center justify-center space-x-2 text-primary font-bold`}>
            <div>
                {text}
            </div>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    )
}
