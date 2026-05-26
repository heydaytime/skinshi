import { useState } from "react";
import { Image, Text, View } from "react-native";

function normalizeRemoteUri(uri: string) {
	if (uri.startsWith("data:") || uri.startsWith("blob:")) return uri;
	if (uri.startsWith("//")) return `https:${uri}`;
	if (uri.startsWith("http://")) return uri.replace("http://", "https://");
	if (uri.startsWith("economy/image/") || !uri.includes("/")) {
		return `https://steamcommunity-a.akamaihd.net/economy/image/${uri.replace(/^\/+/, "")}`;
	}
	return uri;
}

export function RemoteImage({
	uri,
	size,
	rounded = 12,
	label,
}: {
	uri?: string | null;
	size: number;
	rounded?: number;
	label?: string;
}) {
	const [failed, setFailed] = useState(false);

	if (!uri || failed) {
		return (
			<View
				className="items-center justify-center bg-zinc-800"
				style={{ width: size, height: size, borderRadius: rounded }}
			>
				{label ? <Text className="text-[10px] text-zinc-400">{label}</Text> : null}
			</View>
		);
	}

	return (
		<Image
			source={{ uri: normalizeRemoteUri(uri) }}
			resizeMode="contain"
			onError={() => setFailed(true)}
			style={{ width: size, height: size, borderRadius: rounded }}
		/>
	);
}
