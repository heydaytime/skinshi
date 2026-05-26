import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export function useUserProfile() {
	const trpc = useTRPC();
	return useQuery({
		...trpc.user.profile.queryOptions(),
		enabled: false,
	});
}
