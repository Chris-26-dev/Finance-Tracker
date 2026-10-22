import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";

type Props = {
    account: string;
    accountId: string;
};

export const AccountColumn = ({
    account,
    accountId
}: Props) => {
    const {onOpen: onOpenAccount} = useOpenAccount();

    return (
        <button
            type="button"
            onClick={() => onOpenAccount(accountId)}
            className="max-w-40 truncate rounded-sm text-left text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label={`Edit account ${account}`}
        >
            {account}
        </button>
    );
};
