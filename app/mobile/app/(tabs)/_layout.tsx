import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerStyle: { backgroundColor: "#000" },
				headerTintColor: "#fff",
				tabBarShowLabel: false,
				tabBarActiveTintColor: "#34d399",
				tabBarInactiveTintColor: "#71717a",
				tabBarStyle: {
					backgroundColor: "#050507",
					borderTopColor: "rgba(255,255,255,0.08)",
					height: 72,
					paddingTop: 10,
					paddingBottom: 14,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Markets",
					tabBarIcon: ({ color, focused }) => (
						<MaterialCommunityIcons name={focused ? "view-grid" : "view-grid-outline"} size={26} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="trades"
				options={{
					title: "Trades",
					tabBarIcon: ({ color, focused }) => (
						<MaterialCommunityIcons name={focused ? "swap-horizontal-bold" : "swap-horizontal"} size={26} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, focused }) => (
						<MaterialCommunityIcons name={focused ? "account-circle" : "account-circle-outline"} size={26} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
