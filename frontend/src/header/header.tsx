import { useContext, useState } from "react";
import { MenuButton } from "../buttons/menuButton";
import { VscAccount } from "react-icons/vsc";
import { Link, useNavigate } from "react-router-dom";
import Hamburger from "hamburger-react";
import { Context } from "../App";
import { auth } from "../firebase";
import { FaSignOutAlt } from "react-icons/fa";


export const Header = () => {
    const [isOpen, setOpen] = useState(false);
    const { player } = useContext(Context);

    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            console.log("SIGN OUT");
            navigate("/");
        }
        catch (error) {
            console.log(error);
        }
    }


    return (
        <div
            className="flex flex-col w-full bg-primary">
            <div
                className="md:hidden w-full">
                <Hamburger toggled={isOpen} toggle={setOpen} color="white" />
            </div>

            <div
                className="relative flex flex-col items-center justify-center w-full">
                {player &&
                    <Link
                        className="hidden md:flex md:absolute md:left-0 md:top-1/2 -translate-y-1/2 h-full px-3 hover:bg-secondary items-center gap-2 text-white z-10"
                        to={"/users/" + player.id}
                    >
                        <VscAccount size={20} />
                        <span className="max-w-[180px] truncate">{player.nickname}</span>
                    </Link>
                }

                <div
                    className={`${!isOpen ? "hidden md:flex" : ""} flex flex-col md:flex-row md:gap-4 w-full md:w-auto`}>
                    {!player && <MenuButton text="LOGIN" link="/" setOpen={setOpen} />}
                    {!player && <MenuButton text="SIGN UP" link="/register" setOpen={setOpen} />}

                    {player && (
                        <Link
                            className="md:hidden py-3 px-6 hover:bg-secondary flex items-center gap-2 text-white"
                            to={"/users/" + player.id}
                            onClick={() => setOpen(false)}
                        >
                            <VscAccount size={20} />
                            <span>{player.nickname}</span>
                        </Link>
                    )}

                    {player && <MenuButton text="HOME" link="/" setOpen={setOpen} />}
                    {player && <MenuButton text="TOURNAMENTS" link="/tournaments" setOpen={setOpen} />}
                    {player && <MenuButton text="PLAYERS" link="/users" setOpen={setOpen} />}
                    {player && <MenuButton text="SPECIAL" link="/special" setOpen={setOpen} />}
                </div>

                {player && (
                    <button
                        className={`${!isOpen ? "hidden md:flex" : ""} text-2xl py-3 w-full md:w-auto inline-flex items-center justify-center gap-2
    md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 h-full px-6
    text-white hover:bg-secondary`}
                        onClick={() => {
                            setOpen(false)
                            handleLogout()
                        }}
                    >
                        <span className="text-base font-semibold leading-none">Logout</span>
                        <FaSignOutAlt className="text-xl leading-none" />
                    </button>

                )}
            </div>
        </div>
    )
};
