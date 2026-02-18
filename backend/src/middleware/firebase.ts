import admin, { ServiceAccount } from 'firebase-admin';
import serviceAccountCredentials from '../../serviceAccountKey.json';


const serviceAccount: ServiceAccount = serviceAccountCredentials;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const validateFirebaseToken = async (token?: string): Promise<string | null | undefined> => {
    try {
        if (!token) {
            throw new Error("Missing ID token");
        }
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded.email;
    }
    catch (e) {
        console.error("Token verification failed:", e);
        return null;
    }
};
