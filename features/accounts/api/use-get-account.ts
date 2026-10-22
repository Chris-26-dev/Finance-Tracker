import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { handleResponse } from "@/lib/api-response";

export const useGetAccount = (id?: string) => {
    const query = useQuery({
        enabled: !!id,
        queryKey: ["account", { id }],
        queryFn: async () => {
            const response = await client.api.accounts[":id"].$get({
                param: { id },
            });

            const { data } = await handleResponse(response);
            return data;
        },
    });

    return query;
};