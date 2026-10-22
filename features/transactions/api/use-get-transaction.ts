import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { handleResponse } from "@/lib/api-response";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetTransaction = (id?: string) => {
    const query = useQuery({
        enabled: !!id,
        queryKey: ["transaction", { id }],
        queryFn: async () => {
            const response = await client.api.transactions[":id"].$get({
                param: { id },
            });

            const { data } = await handleResponse(response);
            return {
                ...data,
                amount: convertAmountFromMiliunits(data.amount),
            };
        },
    });

    return query;
};