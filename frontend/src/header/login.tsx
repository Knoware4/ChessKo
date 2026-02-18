import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";
import { LoginForm } from "../types/forms/loginForm";
import { FaChessQueen } from "react-icons/fa";
import { PlaceholderInput } from "../inputs/placeholderInput";


export const Login = () => {
    const { register, handleSubmit, reset } = useForm<LoginForm>();
    const [error, setError] = useState<string>(" ");

    const handleLogin = async (data: LoginForm) => {
        try {
            try {
                setError(" ");
                await signInWithEmailAndPassword(auth, data.email, data.password);
                reset();
            }
            catch {
                setError("Incorrect e-mail or password");
                console.log("Login error");
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    return (
        <form
            className="flex flex-col gap-2 p-4 rounded-lg w-full max-w-xs mx-auto bg-white shadow-md rounded-2xl"
            onSubmit={handleSubmit(handleLogin)}
        >
            <div
                className="w-full max-w-sm mx-auto text-center">
                <h2 className="text-2xl font-bold text-center mb-6 text-[#1d2e4a]">Login</h2>
            </div>
            <div
                className="space-y-5">
                <PlaceholderInput<LoginForm> isNum={false} isRequired={true} placeholderText="E-mail" register={register} valueName={"email"} isPwd={false} />
                <PlaceholderInput<LoginForm> isNum={false} isRequired={true} placeholderText="Password" register={register} valueName={"password"} isPwd={true} />
            </div>
            <button
                className="w-full px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
                type="submit"
            >
                <div
                    className="mx-auto flex">
                    Login
                    <FaChessQueen className="w-5 h-5 ml-1" />
                </div>
            </button>
            <div
                className="text-red-700">
                {error}
            </div>
        </form>
    )
}
