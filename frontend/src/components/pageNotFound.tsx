import { FaExclamationTriangle } from "react-icons/fa";

export const PageNotFound = () => {
    return (
        <div 
            className="min-h-screen flex items-center justify-center space-x-2 text-primary font-bold">
            <div>
                Page not found...
            </div>
            <FaExclamationTriangle className="w-10 h-10 text-primary" />
        </div>
    )
}
