import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { handleResponse } from "@/lib/api-response";

export const useGetCategory = (id?: string) => {
    const query = useQuery({
        enabled: !!id,
        queryKey: ["category", { id }],
        queryFn: async () => {
            const response = await client.api.categories[":id"].$get({
                param: { id },
            });

            const { data } = await handleResponse(response);
            return data;
        },
    });

    return query;
};