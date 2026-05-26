import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useAuth } from "~/context/AuthContext";
import { useRouter } from "expo-router";
import { RemoteImage } from "~/components/RemoteImage";

export default function InventoryScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const trpc = useTRPC();

	const { data: inventory, isLoading } = useQuery({
		...trpc.user.inventory.queryOptions(),
		enabled: !!user,
	});

	if (!user) {
		return (
			<View className="flex-1 bg-black items-center justify-center px-6">
				<Text className="text-zinc-400 text-center mb-4">Log in to view your inventory</Text>
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

	const grouped = inventory?.items.reduce<Record<string, typeof inventory.items[0] & { count: number }>>((acc, item) => {
		if (!acc[item.classid]) {
			acc[item.classid] = { ...item, count: 0 };
		}
		acc[item.classid].count++;
		return acc;
	}, {});

	return (
		<ScrollView className="flex-1 bg-black" contentContainerClassName="p-4 pb-8">
			<Text className="text-white text-2xl font-bold mb-4">Inventory</Text>
			{!grouped || Object.keys(grouped).length === 0 ? (
				<Text className="text-zinc-500 text-center mt-8">No items found.</Text>
			) : (
			<View className="flex-row flex-wrap">
				{Object.values(grouped).map((item) => (
					<View
						key={item.classid}
						className="w-[31.33%] aspect-square rounded-xl border border-white/10 bg-[#101218] m-[1%] items-center justify-center p-2"
					>
						<RemoteImage uri={item.icon_url} size={48} rounded={12} label="?" />
						<Text className="text-white text-[11px] text-center mt-2" numberOfLines={2}>
								{item.name}
							</Text>
							{item.count > 1 && (
								<View className="absolute top-1 right-1 bg-emerald-500 rounded-full px-1.5 py-0.5">
									<Text className="text-white text-xs font-bold">{item.count}</Text>
								</View>
							)}
						</View>
					))}
				</View>
			)}
		</ScrollView>
	);
}
