import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
	apiKey: "AIzaSyDVLeC8Z5Rta9xvOSwOUUwBsdBebV9wdvc",
	authDomain: "heydayproject.firebaseapp.com",
	projectId: "heydayproject",
	storageBucket: "heydayproject.firebasestorage.app",
	messagingSenderId: "387224207641",
	appId: "1:387224207641:web:ef397100748e1207984588",
	measurementId: "G-742TNXL2WT",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = (() => {
	try {
		return initializeAuth(app, {
			persistence: getReactNativePersistence(AsyncStorage),
		});
	} catch {
		return getAuth(app);
	}
})();
