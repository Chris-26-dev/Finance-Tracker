"use client";

import { Plus, Tags } from "lucide-react";

import { useNewCategory } from "@/features/categories/hooks/use-new-category";
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories";
import { useGetCategories } from "@/features/categories/api/use-get-categories";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";

import { columns } from "./columns";

const CategoriesPage = () => {
    const newCategory = useNewCategory();
    const deleteCategories = useBulkDeleteCategories();
    const categoriesQuery = useGetCategories();
    const categories = categoriesQuery.data || [];

    const isDisabled =
        categoriesQuery.isLoading ||
        deleteCategories.isPending;

    return (
        <div className="space-y-6">
            <PageHeader
                description="Categories group your spending so you can see where your money goes."
                actions={
                    <Button onClick={newCategory.onOpen}>
                        <Plus className="size-4" />
                        New category
                    </Button>
                }
            />
            {categoriesQuery.isLoading ? (
                <TableSkeleton />
            ) : categoriesQuery.isError ? (
                <div className="rounded-lg border bg-card">
                    <ErrorState
                        title="Couldn't load categories"
                        error={categoriesQuery.error}
                        onRetry={() => categoriesQuery.refetch()}
                    />
                </div>
            ) : (
                <DataTable
                    searchKeys={["name"]}
                    searchPlaceholder="Search categories"
                    columns={columns}
                    data={categories}
                    onDelete={(row) => {
                        const ids = row.map((r) => r.original.id);
                        deleteCategories.mutate({ ids });
                    }}
                    deleteDescription={(count) =>
                        `${count === 1 ? "This category" : `These ${count} categories`} will be deleted. Their transactions will become uncategorized.`
                    }
                    disabled={isDisabled}
                    emptyState={
                        <div className="rounded-lg border border-dashed bg-card">
                            <EmptyState
                                icon={Tags}
                                title="No categories yet"
                                description="Create categories like Food, Rent or Travel to see where your money goes."
                                action={
                                    <Button onClick={newCategory.onOpen}>
                                        <Plus className="size-4" />
                                        New category
                                    </Button>
                                }
                            />
                        </div>
                    }
                />
            )}
        </div>
    );
};

export default CategoriesPage;
