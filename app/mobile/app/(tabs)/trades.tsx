import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useAuth } from "~/context/AuthContext";
import { useRouter } from "expo-router";
import { formatDate } from "@skinshi/utils";

const statusColors: Record<string, string> = {
	active: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
	payout_pending: "text-amber-400 bg-amber-500/20 border-amber-500/30",
	lost: "text-rose-400 bg-rose-500/20 border-rose-500/30",
	cancelled: "text-zinc-400 bg-zinc-500/20 border-zinc-500/30",
	paid: "text-blue-400 bg-blue-500/20 border-blue-500/30",
};

export default function TradesScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const trpc = useTRPC();

	const { data: bets, isLoading } = useQuery({
		...trpc.user.bets.queryOptions(),
		enabled: !!user,
	});

	if (!user) {
		return (
			<View className="flex-1 bg-black items-center justify-center px-6">
				<Text className="text-zinc-400 text-center mb-4">Log in to view your trades</Text>
				<Pressable
					onPress={() => router.push("/login")}
					className="bg-emerald-500/20 border border-emerald-500/30 px-6 py-2.5 rounded-lg"
				>
					<Text className="text-emerald-100 font-semibold">Login</Text>
				</Pressable>
			</View>
		);
	}

	if (isLoading) {
		return (
			<View className="flex-1 bg-black items-center justify-center">
				<ActivityIndicator size="large" color="#10b981" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-black" contentContainerClassName="p-4 pb-8">
			<Text className="text-white text-2xl font-bold mb-4">My Trades</Text>
			{bets?.length === 0 && (
				<Text className="text-zinc-500 text-center mt-8">No trades yet.</Text>
			)}
			{bets?.map((bet) => {
				const colorClass = statusColors[bet.status] || statusColors.cancelled;
				return (
					<View
						key={bet.marketId}
						className="mb-3 rounded-xl border border-white/10 bg-[#141721] p-4"
					>
						<View className="flex-row justify-between items-start mb-2">
							<Text className="text-white font-medium flex-1 mr-2" numberOfLines={1}>
								{bet.marketId}
							</Text>
							<View className={`px-2 py-0.5 rounded-full border ${colorClass}`}>
								<Text className="text-xs capitalize">{bet.status.replace("_", " ")}</Text>
							</View>
						</View>
						<View className="flex-row justify-between">
							<Text className="text-zinc-400 text-sm">
								Outcome: {bet.marketOutcome === 1 ? "Yes" : "No"}
							</Text>
							<Text className="text-zinc-400 text-sm">
								Cases: {bet.buyIn.items.length}
							</Text>
						</View>
						<Text className="text-zinc-500 text-xs mt-1">
							{formatDate(bet.createdAt)}
						</Text>
					</View>
				);
			})}
		</ScrollView>
	);
}
