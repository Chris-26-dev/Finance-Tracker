import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { handleResponse } from "@/lib/api-response";

type ResponseType = InferResponseType<typeof client.api.accounts["bulk-delete"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.accounts["bulk-delete"]["$post"]>["json"];

export const useBulkDeleteAccounts = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
    ResponseType,
    Error,
    RequestType
    >({
        mutationFn: async (json) => {
            const response = await client.api.accounts["bulk-delete"]["$post"]({ json });
            return await handleResponse(response);
        },
        onSuccess: () => {
            toast.success("Accounts deleted")
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            // Deleting an account cascades to its transactions.
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
        },
        onError: (error) => {
            toast.error("Failed to delete accounts", { description: error.message })
        },
    });

    return mutation;
}
