import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/SearchInput";
import { medicinesApi } from "@/lib/api";

const PLACEHOLDER = "/placeholder.svg";
const MAX_USES = 3;

export function MedicinesListPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const { data: medicines, isLoading, isError, error } = useQuery({
    queryKey: ["medicines"],
    queryFn: medicinesApi.list,
  });

  const filtered = useMemo(() => {
    if (!medicines) return [];
    const q = query.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((med) => med.name.toLowerCase().includes(q));
  }, [medicines, query]);

  const deleteMutation = useMutation({
    mutationFn: medicinesApi.remove,
    onSuccess: () => {
      toast.success("Medicine deleted");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Medicines</h1>
          <p className="text-sm text-muted-foreground">
            Manage the medicine catalog shown on the public site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {medicines && medicines.length > 0 && (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by name…"
              className="w-44 sm:w-56"
            />
          )}
          <Button asChild className="shrink-0">
            <Link to="/medicines/new">
              <Plus className="h-4 w-4" />
              Add medicine
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="aspect-video w-full" />
        </div>
      )}

      {isError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load medicines:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {medicines && medicines.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No medicines yet. Click "Add medicine" to create the first one.
        </p>
      )}

      {medicines && medicines.length > 0 && filtered.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No medicines match "{query}".
        </p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((med) => (
            <div
              key={med.id}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card"
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={med.image_url || PLACEHOLDER}
                  alt={med.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
                      e.currentTarget.src = PLACEHOLDER;
                    }
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="truncate font-medium">{med.name}</h2>
                  {med.tibetan_name && (
                    <span className="shrink-0 font-display text-sm text-muted-foreground">
                      {med.tibetan_name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {med.category && (
                    <Badge variant="outline">{med.category}</Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      med.in_stock
                        ? "text-emerald-700"
                        : "text-destructive"
                    }
                  >
                    {med.in_stock ? "In stock" : "Out of stock"}
                  </Badge>
                  {med.price > 0 && (
                    <span className="text-sm font-medium">
                      €{med.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {med.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {med.description}
                  </p>
                )}

                {med.uses.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {med.uses.slice(0, MAX_USES).map((use) => (
                      <Badge key={use} variant="secondary">
                        {use}
                      </Badge>
                    ))}
                    {med.uses.length > MAX_USES && (
                      <Badge variant="secondary">
                        +{med.uses.length - MAX_USES}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-auto flex justify-end gap-1 border-t pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/medicines/${med.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the medicine from the
                          public site. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(med.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
