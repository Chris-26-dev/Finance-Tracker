import { AccountFilter } from "@/components/account-filter"
import { DateFilter } from "@/components/date-filter"

export const Filters = () => {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <AccountFilter />
            <DateFilter />
        </div>
    )
}
