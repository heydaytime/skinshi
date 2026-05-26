import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTRPC } from "~/lib/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
	View,
	Text,
	ScrollView,
	Pressable,
	TextInput,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useAuth } from "~/context/AuthContext";
import { formatDate } from "@skinshi/utils";
import { RemoteImage } from "~/components/RemoteImage";

export default function BetScreen() {
	const { slug } = useLocalSearchParams<{ slug: string }>();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const trpc = useTRPC();

	const [selectedOutcome, setSelectedOutcome] = useState<1 | 0>(1);
	const [pool, setPool] = useState<Record<string, { item: any; quantity: number }>>({});
	const [tradeUrl, setTradeUrl] = useState("");
	const [message, setMessage] = useState("Here's my bet!");

	const { data: market, isLoading: marketLoading } = useQuery({
		...trpc.polymarket.market.queryOptions({ slug: slug!, id: id || "" }),
		enabled: !!slug && !!id,
	});

	const { data: inventory, isLoading: invLoading } = useQuery({
		...trpc.user.inventory.queryOptions(),
		enabled: !!user,
	});

	const { data: meData } = useQuery({
		...trpc.me.queryOptions(),
		enabled: !!user,
	});

	const betMutation = useMutation({
		...trpc.bet.trade.mutationOptions(),
		onSuccess: () => {
			Alert.alert("Bet Placed!", "Check Steam for your trade offer.", [
				{ text: "OK", onPress: () => router.back() },
			]);
		},
		onError: (err) => {
			Alert.alert("Error", err.message);
		},
	});

	const groupedInventory = inventory?.items.reduce<Record<string, any[]>>((acc, item) => {
		if (!acc[item.classid]) acc[item.classid] = [];
		acc[item.classid].push(item);
		return acc;
	}, {});

	function addToPool(classid: string) {
		const items = groupedInventory?.[classid];
		if (!items) return;
		const currentQty = pool[classid]?.quantity || 0;
		if (currentQty >= items.length) return;

		setPool((prev) => ({
			...prev,
			[classid]: {
				item: items[0],
				quantity: currentQty + 1,
			},
		}));
	}

	function removeFromPool(classid: string) {
		setPool((prev) => {
			const current = prev[classid];
			if (!current) return prev;
			if (current.quantity <= 1) {
				const { [classid]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [classid]: { ...current, quantity: current.quantity - 1 } };
		});
	}

	function handleConfirm() {
		if (!market) return;
		const items = Object.values(pool).flatMap(({ item, quantity }) => {
			const group = groupedInventory?.[item.classid] || [];
			return group.slice(0, quantity).map((i: any) => ({
				appid: i.appid,
				contextid: i.contextid,
				assetid: i.assetid,
				classid: i.classid,
				instanceid: i.instanceid,
				icon_url: i.icon_url,
				background_color: i.background_color,
				name: i.name,
			}));
		});

		betMutation.mutate({
			slug: market.slug,
			id: market.id,
			marketOutcome: selectedOutcome,
			tradeUrl,
			message,
			items,
		});
	}

	if (marketLoading) {
		return (
			<View className="flex-1 bg-black items-center justify-center">
				<ActivityIndicator size="large" color="#10b981" />
			</View>
		);
	}

	if (!market) {
		return (
			<View className="flex-1 bg-black items-center justify-center px-6">
				<Text className="text-zinc-400">Market not found</Text>
			</View>
		);
	}

	const isResolved = market.status === "resolved" || market.status === "cancelled";
	const poolItems = Object.values(pool);
	const poolCount = poolItems.reduce((sum, p) => sum + p.quantity, 0);

	return (
		<ScrollView className="flex-1 bg-black" contentContainerClassName="p-4 pb-8">
			<View className="flex-row items-start gap-3 mb-4">
				<RemoteImage uri={market.icon} size={64} rounded={16} label="?" />
				<View className="flex-1 min-w-0">
					<Text className="text-white text-xl font-bold leading-7" numberOfLines={3}>
						{market.question}
					</Text>
					<Text className="text-zinc-500 text-sm mt-1">{formatDate(market.createdAt)}</Text>
				</View>
			</View>

			{isResolved ? (
				<View className="rounded-xl border border-white/10 bg-[#141721] p-4 mb-4">
					<Text className="text-zinc-400 text-center">This market is closed.</Text>
				</View>
			) : (
				<>
					<View className="flex-row mb-4">
						<Pressable
							onPress={() => setSelectedOutcome(1)}
							className={`flex-1 py-3 rounded-xl mr-2 items-center ${
								selectedOutcome === 1
									? "bg-emerald-500/30 border border-emerald-500/50"
									: "bg-[#141721] border border-white/10"
							}`}
						>
							<Text
								className={`font-semibold ${
									selectedOutcome === 1 ? "text-emerald-100" : "text-zinc-400"
								}`}
							>
								Bet YES
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setSelectedOutcome(0)}
							className={`flex-1 py-3 rounded-xl ml-2 items-center ${
								selectedOutcome === 0
									? "bg-rose-500/30 border border-rose-500/50"
									: "bg-[#141721] border border-white/10"
							}`}
						>
							<Text
								className={`font-semibold ${
									selectedOutcome === 0 ? "text-rose-100" : "text-zinc-400"
								}`}
							>
								Bet NO
							</Text>
						</Pressable>
					</View>

					{!meData?.dbUser ? (
						<View className="rounded-xl border border-amber-500/30 bg-amber-500/20 p-4 mb-4">
							<Text className="text-amber-100 text-sm text-center">
								Steam account required to place bets. Please link your Steam account on the web app.
							</Text>
						</View>
					) : (
						<>
							<View className="rounded-xl border border-white/10 bg-[#141721] p-4 mb-4">
								<Text className="text-white font-semibold mb-2">Bet Pool ({poolCount} items)</Text>
								{poolCount === 0 && (
									<Text className="text-zinc-500 text-sm">Tap items below to add them</Text>
								)}
								<View className="flex-row flex-wrap mt-2">
									{poolItems.map(({ item, quantity }) => (
										<Pressable
											key={item.classid}
											onPress={() => addToPool(item.classid)}
											className="w-[31.33%] aspect-square rounded-xl border border-white/10 bg-[#101218] m-[1%] items-center justify-center p-2 active:opacity-80"
										>
											<RemoteImage uri={item.icon_url} size={48} rounded={12} label="?" />
											<Text className="text-white text-[11px] text-center mt-2" numberOfLines={2}>
												{item.name}
											</Text>
											<View className="flex-row items-center mt-2 gap-2">
												<Pressable
													onPress={() => removeFromPool(item.classid)}
													className="w-7 h-7 rounded-full bg-zinc-800 items-center justify-center"
												>
													<Text className="text-white font-bold">-</Text>
												</Pressable>
												<Text className="text-white min-w-[18px] text-center">{quantity}</Text>
												<Pressable
													onPress={() => addToPool(item.classid)}
													className="w-7 h-7 rounded-full bg-zinc-800 items-center justify-center"
												>
													<Text className="text-white font-bold">+</Text>
												</Pressable>
											</View>
										</Pressable>
									))}
								</View>
								</View>

								<TextInput
									value={tradeUrl}
									onChangeText={setTradeUrl}
									placeholder="Steam Trade URL"
									placeholderTextColor="#52525b"
									className="w-full rounded-xl border border-white/10 bg-[#141721] px-4 py-3 text-white mb-3"
								/>

								<TextInput
									value={message}
									onChangeText={setMessage}
									placeholder="Message"
									placeholderTextColor="#52525b"
									className="w-full rounded-xl border border-white/10 bg-[#141721] px-4 py-3 text-white mb-4"
								/>

								<Pressable
									onPress={handleConfirm}
									disabled={poolCount === 0 || !tradeUrl || betMutation.isPending}
									className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-3 items-center disabled:opacity-60 mb-4"
								>
									<Text className="text-emerald-100 font-semibold text-base">
										{betMutation.isPending ? "Placing bet..." : `Confirm Bet (${poolCount} cases)`}
									</Text>
								</Pressable>

								<Text className="text-white font-semibold mb-2">Your Inventory</Text>
								{invLoading ? (
									<ActivityIndicator size="small" color="#10b981" />
								) : !groupedInventory || Object.keys(groupedInventory).length === 0 ? (
									<Text className="text-zinc-500 text-sm">No items found.</Text>
								) : (
					<View className="flex-row flex-wrap">
						{Object.entries(groupedInventory).map(([classid, items]) => {
							const inPool = pool[classid]?.quantity || 0;
							const available = items.length - inPool;
							return (
								<Pressable
									key={classid}
									onPress={() => available > 0 && addToPool(classid)}
									className={`w-[31.33%] aspect-square rounded-xl border m-[1%] items-center justify-center p-2 ${
										available > 0
											? "border-white/10 bg-[#101218] active:opacity-80"
											: "border-white/5 bg-zinc-900 opacity-50"
									}`}
								>
									<RemoteImage uri={items[0].icon_url} size={48} rounded={12} label="?" />
									<Text className="text-white text-[11px] text-center mt-2" numberOfLines={2}>
										{items[0].name}
									</Text>
													{inPool > 0 && (
														<View className="absolute top-1 right-1 bg-emerald-500 rounded-full px-1.5 py-0.5">
															<Text className="text-white text-xs font-bold">{inPool}</Text>
														</View>
													)}
													{available === 0 && (
														<View className="absolute inset-0 bg-black/50 rounded-xl items-center justify-center">
															<Text className="text-zinc-400 text-xs">All in pool</Text>
														</View>
													)}
												</Pressable>
											);
										})}
									</View>
								)}
							</>
						)}
					</>
				)}
		</ScrollView>
	);
}
