import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useForm } from "react-hook-form"
import { RegisterPlayerMutation } from "../mutations/player";
import { useNavigate } from "react-router-dom";
import { PlaceholderInput } from "../inputs/placeholderInput";
import { useState } from "react";
import { Loading } from "../components/loading";


interface AddUserForm {
    nickname: string,
    email: string,
    password: string,
    confirmPassword: string,
}


export const Register = () => {
    const { register, handleSubmit } = useForm<AddUserForm>();
    const [error, setError] = useState(" ");
    const registerPlayerMutation = RegisterPlayerMutation();
    const navigate = useNavigate();
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    async function onSubmit(data: AddUserForm) {
        try {
            if (data.password !== data.confirmPassword) {
                setError("Passwords are different.");
            }
            else {
                setIsCreatingAccount(true);
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                console.log(userCredential);
                registerPlayerMutation.mutateAsync(data);
                navigate("/");
            }
        }
        catch (error) {
            setIsCreatingAccount(false);
            setError("Something went wrong.")
        }
    }


    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br p-6 bg-gray-100">
            <div
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2
                    className="text-2xl font-bold text-center mb-6 text-[#1d2e4a]">
                    Register
                </h2>
                <form
                    className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <PlaceholderInput placeholderText="Nickname" register={register} valueName="nickname" />
                    <PlaceholderInput placeholderText="E-mail" register={register} valueName="email" />
                    <PlaceholderInput placeholderText="Password" register={register} valueName="password" isPwd={true} />
                    <PlaceholderInput placeholderText="Confirm Password" register={register} valueName="confirmPassword" isPwd={true} />
                    {
                        !isCreatingAccount &&
                        <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1d2e4a] to-[#304c7a] text-white font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md">
                            Submit
                        </button>
                    }
                    {
                        isCreatingAccount &&
                        <Loading text="Creating account" />
                    }
                    <div
                        className="text-red-700">
                        {error}
                    </div>
                </form>
            </div>
        </div>
    )
}
