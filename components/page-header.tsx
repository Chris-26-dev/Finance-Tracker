type Props = {
    description: React.ReactNode;
    actions?: React.ReactNode;
};

/** Intro line and primary actions; the page title lives in the top bar. */
export const PageHeader = ({ description, actions }: Props) => {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{description}</p>
            {actions && <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">{actions}</div>}
        </div>
    );
};
