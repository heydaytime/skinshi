import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TRPCReactProvider } from "~/lib/trpc";
import { AuthProvider } from "~/context/AuthContext";

export default function RootLayout() {
	return (
		<TRPCReactProvider>
			<AuthProvider>
				<Stack
					screenOptions={{
						headerStyle: { backgroundColor: "#000" },
						headerTintColor: "#fff",
						contentStyle: { backgroundColor: "#000" },
					}}
				>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="login" options={{ title: "Login", presentation: "modal" }} />
					<Stack.Screen name="register" options={{ title: "Register", presentation: "modal" }} />
					<Stack.Screen name="bet/[slug]" options={{ title: "Place Bet", headerBackTitle: "Markets" }} />
					<Stack.Screen name="profile/inventory" options={{ title: "Inventory", headerBackTitle: "Profile" }} />
				</Stack>
				<StatusBar style="light" />
			</AuthProvider>
		</TRPCReactProvider>
	);
}
