import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// Replace with your Firebase configuration
const firebaseConfig = {
    apiKey: "yourApiKey",
    authDomain: "yourAuthDomain",
    projectId: "yourProjectId",
    storageBucket: "yourStorageBucket",
    messagingSenderId: "yourMessagingSenderId",
    appId: "yourAppId",
    measurementId: "yourMeasurementId",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
