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
import { articlesApi } from "@/lib/api";

const PLACEHOLDER = "/placeholder.svg";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ArticlesPage() {
  const queryClient = useQueryClient();
  const { data: articles, isLoading, isError, error } = useQuery({
    queryKey: ["articles"],
    queryFn: articlesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: articlesApi.remove,
    onSuccess: () => {
      toast.success("Article deleted");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Articles</h1>
          <p className="text-sm text-muted-foreground">
            Manage the articles shown on the public site.
          </p>
        </div>
        <Button asChild>
          <Link to="/articles/new">
            <Plus className="h-4 w-4" />
            Add article
          </Link>
        </Button>
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
          Failed to load articles:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {articles && articles.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No articles yet. Click "Add article" to create the first one.
        </p>
      )}

      {articles && articles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card"
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={article.image_url || PLACEHOLDER}
                  alt={article.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
                      e.currentTarget.src = PLACEHOLDER;
                    }
                  }}
                />
                {article.category && (
                  <Badge className="absolute left-2 top-2">
                    {article.category}
                  </Badge>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="space-y-1">
                  <h2 className="line-clamp-2 font-medium">{article.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(article.published_at)}
                  </p>
                </div>

                {article.excerpt && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                )}

                <div className="mt-auto flex justify-end gap-1 border-t pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/articles/${article.id}/edit`}>
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
                        <AlertDialogTitle>
                          Delete {article.title}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the article from the
                          public site. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(article.id)}
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
