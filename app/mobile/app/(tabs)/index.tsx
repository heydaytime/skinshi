import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import type { OurMarket } from "@skinshi/api/schemas";
import { RemoteImage } from "~/components/RemoteImage";

function formatTimeRemaining(endDate: Date) {
	const now = new Date();
	if (endDate <= now) return "Closed";

	const diffMs = endDate.getTime() - now.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

	if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
	if (diffHours > 0) return `${diffHours}h`;
	return "< 1h";
}

function MarketCard({ market }: { market: OurMarket }) {
	const router = useRouter();
	const isResolved = market.status === "resolved" || market.status === "cancelled";
	const totalPool = market.totalPoolYes + market.totalPoolNo;
	const yesPct = totalPool > 0 ? Math.round((market.totalPoolYes / totalPool) * 100) : 50;
	const noPct = 100 - yesPct;
	const resolvedReason =
		market.status === "resolved" ? "Market resolved" : market.status === "cancelled" ? "Market cancelled" : null;
	const polymarketYesPct = Math.round((market.polymarketYesProbability ?? 0.5) * 100);
	const polymarketNoPct = 100 - polymarketYesPct;

	return (
		<Pressable
			onPress={() => router.push(`/bet/${market.slug}?id=${market.id}`)}
			className={`mb-4 rounded-2xl border border-white/10 bg-[#101218] p-4 active:opacity-80 ${
				isResolved ? "opacity-60" : ""
			}`}
		>
			<View className="flex-row items-start gap-3 mb-3">
				<RemoteImage uri={market.icon} size={48} rounded={12} label="?" />
				<View className="flex-1 min-w-0">
					<Text className="text-white font-semibold text-[17px] leading-6" numberOfLines={3}>
						{market.question}
					</Text>
					<View className="flex-row items-center gap-2 mt-1">
						<Text className="text-zinc-500 text-xs capitalize">{market.status}</Text>
						<Text className="text-zinc-600 text-xs">•</Text>
						<Text className="text-zinc-500 text-xs">Betting closes: {formatTimeRemaining(market.endDate)}</Text>
					</View>
				</View>
			</View>

			<View className="mb-4">
				<Text className="text-zinc-300 text-xs font-medium mb-1.5">Our Market</Text>
				{totalPool > 0 ? (
					<View className="mb-2">
						<View className="flex-row h-1.5 rounded-full overflow-hidden bg-zinc-800">
							<View className="bg-emerald-500" style={{ width: `${yesPct}%` }} />
							<View className="bg-rose-500" style={{ width: `${noPct}%` }} />
						</View>
						<View className="flex-row justify-between mt-1">
							<Text className="text-emerald-400 text-xs">{yesPct}% Yes</Text>
							<Text className="text-rose-400 text-xs">{noPct}% No</Text>
						</View>
					</View>
				) : (
					<Text className="text-zinc-500 text-xs italic">No bets yet</Text>
				)}
				<View className="flex-row items-center justify-between">
					<Text className="text-zinc-500 text-xs">Polymarket</Text>
					<Text className="text-zinc-500 text-xs">{polymarketYesPct}% / {polymarketNoPct}%</Text>
				</View>
				<View className="mt-1.5 flex-row h-1 rounded-full overflow-hidden bg-zinc-800">
					<View className="bg-blue-400/70" style={{ width: `${polymarketYesPct}%` }} />
					<View className="bg-slate-500/70" style={{ width: `${polymarketNoPct}%` }} />
				</View>
			</View>

			<View className="flex-row items-center justify-between mb-4">
				<Text className="text-zinc-400">Volume:</Text>
				<Text className="text-white font-medium">{totalPool} cases</Text>
			</View>

			<View className="flex-row gap-2">
				<View className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-3 items-center">
					<Text className="text-emerald-400 font-semibold">Bet YES</Text>
				</View>
				<View className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/15 py-3 items-center">
					<Text className="text-rose-400 font-semibold">Bet NO</Text>
				</View>
			</View>

			{isResolved && resolvedReason ? (
				<View className="mt-3 rounded-xl border border-zinc-700/40 bg-zinc-800/40 px-3 py-2">
					<Text className="text-zinc-400 text-xs text-center">{resolvedReason}</Text>
				</View>
			) : null}
		</Pressable>
	);
}

export default function MarketsScreen() {
	const trpc = useTRPC();
	const { data: markets, isLoading, error } = useQuery(trpc.polymarket.allMarkets.queryOptions());

	if (isLoading) {
		return (
			<View className="flex-1 bg-black items-center justify-center">
				<ActivityIndicator size="large" color="#10b981" />
			</View>
		);
	}

	if (error) {
		return (
			<View className="flex-1 bg-black items-center justify-center px-6">
				<Text className="text-rose-400 text-center">{error.message}</Text>
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-black" contentContainerClassName="px-4 pt-4 pb-8">
			<Text className="text-white text-3xl font-bold mb-2">Active Markets</Text>
			<Text className="text-zinc-400 text-base mb-6">Bet your CS2 cases on Polymarket outcomes</Text>
			{markets?.length === 0 && (
				<Text className="text-zinc-500 text-center mt-8">No markets available.</Text>
			)}
			{markets?.map((market) => (
				<MarketCard key={`${market.slug}-${market.id}`} market={market} />
			))}
		</ScrollView>
	);
}
