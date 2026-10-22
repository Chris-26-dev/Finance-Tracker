import { toast } from "sonner";
import { InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { handleResponse } from "@/lib/api-response";
import { DELETE_DATA_CONFIRMATION } from "@/lib/utils";

type ResponseType = InferResponseType<typeof client.api["user-data"]["$delete"], 200>;

export const useDeleteUserData = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
    ResponseType,
    Error
    >({
        mutationFn: async () => {
            const response = await client.api["user-data"]["$delete"]({
                json: { confirm: DELETE_DATA_CONFIRMATION },
            });
            return await handleResponse(response);
        },
        onSuccess: () => {
            toast.success("All your data was deleted")
            // Everything cached belonged to the deleted data.
            queryClient.invalidateQueries();
        },
        onError: (error) => {
            toast.error("Failed to delete your data", { description: error.message })
        },
    });

    return mutation;
}
