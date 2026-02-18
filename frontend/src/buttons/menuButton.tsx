import { Link } from "react-router-dom";


interface MenuButtonProps {
    text: string,
    link: string,
    setOpen: (opened: boolean) => void,
}


export const MenuButton = ({ text, link, setOpen }: MenuButtonProps) => {
    return (
        <Link to={link}>
            <button
                className="text-2xl text-white py-3 px-6 hover:bg-secondary text-center w-full md:w-auto" onClick={() => setOpen(false)}>
                {text}
            </button>
        </Link>
    )
}
