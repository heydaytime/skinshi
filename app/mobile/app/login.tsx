import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/lib/firebase";
import { useRouter } from "expo-router";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleLogin() {
		setError("");
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth, email, password);
			router.dismiss();
		} catch (err: any) {
			setError(err.message || "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-black"
		>
			<View className="flex-1 justify-center px-6">
				<Text className="text-white text-3xl font-bold mb-2">Welcome back</Text>
				<Text className="text-zinc-400 mb-8">Log in to your Skinshi account</Text>

				{error ? (
					<View className="mb-4 rounded-lg border border-rose-400/50 bg-rose-500/20 px-4 py-3">
						<Text className="text-rose-100 text-sm">{error}</Text>
					</View>
				) : null}

				<TextInput
					value={email}
					onChangeText={setEmail}
					placeholder="Email"
					placeholderTextColor="#52525b"
					autoCapitalize="none"
					keyboardType="email-address"
					className="w-full rounded-xl border border-white/10 bg-[#141721] px-4 py-3 text-white mb-4"
				/>

				<TextInput
					value={password}
					onChangeText={setPassword}
					placeholder="Password"
					placeholderTextColor="#52525b"
					secureTextEntry
					className="w-full rounded-xl border border-white/10 bg-[#141721] px-4 py-3 text-white mb-6"
				/>

				<Pressable
					onPress={handleLogin}
					disabled={loading}
					className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-3 items-center disabled:opacity-60"
				>
					<Text className="text-emerald-100 font-semibold text-base">
						{loading ? "Logging in..." : "Login"}
					</Text>
				</Pressable>

				<Pressable onPress={() => router.push("/register")} className="mt-4 items-center">
					<Text className="text-zinc-500 text-sm">
						Don't have an account?{" "}
						<Text className="text-emerald-400">Register</Text>
					</Text>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
	);
}
