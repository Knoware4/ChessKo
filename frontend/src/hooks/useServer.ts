import { useQuery } from "@tanstack/react-query";
import { ServerApi } from "../sevices";


export function useServerIsAlive() {
	return useQuery<string>({
		queryKey: [""],
		queryFn: ServerApi.checkBackendAlive,
	});
}
