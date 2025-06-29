// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyB1zev9GZAHJ57Rzlao8PuzJbxxI-i_6D0",
    authDomain: "storyteller-7ece7.firebaseapp.com",
    projectId: "storyteller-7ece7",
    storageBucket: "storyteller-7ece7.firebasestorage.app",
    messagingSenderId: "500542826961",
    appId: "1:500542826961:web:6242d29af7fe3e3190d8f0",
    measurementId: "G-6RV480TXEE"
  };

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export default app;

// Set this to true for development without real Firebase
export const isDevelopmentMode = __DEV__ && false;

export const developmentAuth = {
    async signInWithEmailAndPassword(email: string, password: string) {
        return {
            user: {
                uid: `dev_user_${Date.now()}`,
                email: email,
                getIdToken: async () => `dev_token_${Date.now()}_${email}`,
            }
        };
    },

    async createUserWithEmailAndPassword(email: string, password: string) {
        return {
            user: {
                uid: `dev_user_${Date.now()}`,
                email: email,
                getIdToken: async () => `dev_token_${Date.now()}_${email}`,
            }
        };
    },

    async signOut() {
        console.log('🧪 Development mode sign out');
    }
};