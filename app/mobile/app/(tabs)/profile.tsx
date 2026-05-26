import type { ReactNode } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "~/context/AuthContext";
import { useTRPC } from "~/lib/trpc";
import { RemoteImage } from "~/components/RemoteImage";

const ONLINE_STATE_STYLES: Record<string, { label: string; dot: string; badge: string }> = {
	online: { label: "Online", dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-400" },
	away: { label: "Away", dot: "bg-yellow-400", badge: "bg-yellow-500/20 text-yellow-400" },
	snooze: { label: "Snooze", dot: "bg-yellow-600", badge: "bg-yellow-700/20 text-yellow-500" },
	offline: { label: "Offline", dot: "bg-zinc-500", badge: "bg-zinc-700 text-zinc-400" },
	"looking to trade": { label: "Looking to Trade", dot: "bg-blue-400", badge: "bg-blue-500/20 text-blue-400" },
	"looking to play": { label: "Looking to Play", dot: "bg-purple-400", badge: "bg-purple-500/20 text-purple-400" },
};

function avatarUrl(hash: string, size: "medium" | "full" = "full") {
	const suffix = size === "full" ? "_full" : "_medium";
	return `https://avatars.steamstatic.com/${hash}${suffix}.jpg`;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View className="rounded-2xl border border-white/10 bg-[#101218] p-4">
			<Text className="text-white text-lg font-semibold mb-4">{title}</Text>
			{children}
		</View>
	);
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<View className="flex-row items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
			<Text className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 shrink-0 pt-0.5">
				{label}
			</Text>
			<Text className="text-sm text-zinc-200 text-right flex-1">{value}</Text>
		</View>
	);
}

function ActionCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
	return (
		<Pressable onPress={onPress} className="rounded-2xl border border-white/10 bg-[#101218] p-4 active:opacity-80">
			<Text className="text-white font-semibold text-base">{title}</Text>
			<Text className="text-zinc-500 text-sm mt-0.5">{subtitle}</Text>
		</Pressable>
	);
}

export default function ProfileScreen() {
	const { user, logout, loading } = useAuth();
	const router = useRouter();
	const trpc = useTRPC();

	const { data: profile, isLoading: profileLoading } = useQuery({
		...trpc.user.profile.queryOptions(),
		enabled: !!user,
	});

	if (loading) {
		return (
			<View className="flex-1 bg-black items-center justify-center">
				<ActivityIndicator size="large" color="#10b981" />
			</View>
		);
	}

	if (!user) {
		return (
			<View className="flex-1 bg-black items-center justify-center px-6">
				<Text className="text-zinc-400 text-center mb-4">Log in to view your profile</Text>
				<Pressable
					onPress={() => router.push("/login")}
					className="bg-emerald-500/20 border border-emerald-500/30 px-6 py-2.5 rounded-xl mb-3"
				>
					<Text className="text-emerald-100 font-semibold">Login</Text>
				</Pressable>
				<Pressable onPress={() => router.push("/register")}> 
					<Text className="text-zinc-500 text-sm">Don't have an account? Register</Text>
				</Pressable>
			</View>
		);
	}

	const state = ONLINE_STATE_STYLES[profile?.onlineState ?? "offline"] ?? ONLINE_STATE_STYLES.offline;
	const profileAvatar = profile?.avatarHash ? avatarUrl(profile.avatarHash, "full") : null;

	return (
		<ScrollView className="flex-1 bg-black" contentContainerClassName="px-4 pt-4 pb-8 gap-4">
			<Text className="text-white text-3xl font-bold mb-2">Profile</Text>
			<Text className="text-zinc-400 text-base mb-2">Steam account and trading settings</Text>

			<SectionCard title="Steam Profile">
				{profile ? (
					<View>
						<View className="flex-row items-center gap-4">
							{profileAvatar ? (
								<RemoteImage uri={profileAvatar} size={72} rounded={16} label={profile.name?.[0]?.toUpperCase() ?? "?"} />
							) : (
								<View className="w-[72px] h-[72px] rounded-2xl bg-zinc-800 items-center justify-center">
									<Text className="text-white text-2xl font-bold">{profile.name?.[0]?.toUpperCase() ?? "?"}</Text>
								</View>
							)}
							<View className="flex-1 min-w-0">
								<View className="flex-row items-center gap-2 flex-wrap">
									<Text className="text-white text-lg font-semibold" numberOfLines={1}>
										{profile.name}
									</Text>
									<View className={`px-2 py-0.5 rounded-full ${state.badge}`}>
										<Text className="text-[10px] font-semibold">{state.label}</Text>
									</View>
								</View>
								<Text className="text-zinc-500 text-sm mt-1" numberOfLines={1}>
									Steam ID: {profile.steamID}
								</Text>
								<View className="flex-row items-center mt-2">
									<View className={`w-2 h-2 rounded-full mr-2 ${state.dot}`} />
									<Text className="text-zinc-400 text-sm">{profile.stateMessage}</Text>
								</View>
							</View>
						</View>
						<Pressable
							onPress={() => {
								const url = profile.customURL
									? `https://steamcommunity.com/id/${profile.customURL}`
									: `https://steamcommunity.com/profiles/${profile.steamID}`;
								Linking.openURL(url);
							}}
							className="mt-4 self-start rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 active:opacity-80"
						>
							<Text className="text-emerald-400 font-semibold">View on Steam</Text>
						</Pressable>
					</View>
				) : (
					<View>
						<Text className="text-zinc-400">No Steam profile linked.</Text>
					</View>
				)}
				{profileLoading ? <ActivityIndicator size="small" color="#10b981" className="mt-4" /> : null}
			</SectionCard>

			<SectionCard title="Account Information">
				<InfoRow label="Email" value={user.email} />
				<InfoRow label="User ID" value={<Text className="font-mono text-xs text-zinc-300">{user.uid}</Text>} />
			</SectionCard>

			<View className="gap-3">
				<ActionCard title="My Inventory" subtitle="View your CS2 cases" onPress={() => router.push("/profile/inventory")} />
			</View>

			<Pressable
				onPress={logout}
				className="rounded-2xl border border-rose-500/30 bg-rose-500/20 p-4 mt-2 active:opacity-80"
			>
				<Text className="text-rose-100 font-medium text-center text-base">Logout</Text>
			</Pressable>
		</ScrollView>
	);
}
