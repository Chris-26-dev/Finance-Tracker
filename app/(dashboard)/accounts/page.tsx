"use client";
//Since this is a hook 
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle
 } from "@/components/ui/card";

import { columns, Payment } from "./columns";

const data: Payment[] = [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "success",
      email: "a@example.com",
    },
  ];

const AccountsPage = () => {
    const newAccount = useNewAccount();

    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
            <Card className="mt-5 border-none drop-shadow-sm">
                <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="text-xl line-clamp-1">
                        Accounts page
                    </CardTitle>
                    <Button onClick={newAccount.onOpen} size="sm">
                        <Plus className ="size-4 mr-2" />
                        Add new
                    </Button>
                </CardHeader>
                <CardContent>
                    <DataTable 
                    filterKey="email"
                    columns={columns} 
                    data={data}
                    onDelete={() => {}}
                    disabled
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountsPage;