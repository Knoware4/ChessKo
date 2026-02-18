import React from "react";


interface SmallArrowButtonProps {
    children: React.ReactNode,
    event: () => void,
    disabled: boolean,
}


export const SmallArrowButton = ({ children, event, disabled }: SmallArrowButtonProps) => {
    return (
        <button
            className="group inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={disabled}
            onClick={event}
            aria-label="Previous round"
        >
            {children}
        </button>
    )
}
