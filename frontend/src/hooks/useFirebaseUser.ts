import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";


export function useFirebaseUser() {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setFirebaseUser);
        return () => unsub();
    }, []);

    return { firebaseUser };
}
