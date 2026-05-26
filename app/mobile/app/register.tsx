import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/lib/firebase";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleRegister() {
		setError("");
		setLoading(true);
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			router.dismissAll();
		} catch (err: any) {
			setError(err.message || "Registration failed");
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
				<Text className="text-white text-3xl font-bold mb-2">Create account</Text>
				<Text className="text-zinc-400 mb-8">Join Skinshi to start betting</Text>

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
					onPress={handleRegister}
					disabled={loading}
					className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-3 items-center disabled:opacity-60"
				>
					<Text className="text-emerald-100 font-semibold text-base">
						{loading ? "Creating account..." : "Register"}
					</Text>
				</Pressable>

				<Pressable onPress={() => router.push("/login")} className="mt-4 items-center">
					<Text className="text-zinc-500 text-sm">
						Already have an account?{" "}
						<Text className="text-emerald-400">Login</Text>
					</Text>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
	);
}
