import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { galleryApi, type GalleryImage } from "@/lib/api";
import { GalleryImageDialog } from "@/pages/gallery/GalleryImageDialog";

export function GalleryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryImage | undefined>(undefined);

  const { data: images, isLoading, isError, error } = useQuery({
    queryKey: ["gallery"],
    queryFn: galleryApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: galleryApi.remove,
    onSuccess: () => {
      toast.success("Image deleted");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const openAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (image: GalleryImage) => {
    setEditing(image);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Manage the image gallery shown on the public site.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add image
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="aspect-video w-full" />
        </div>
      )}

      {isError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load gallery:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {images && images.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No images yet. Click "Add image" to add the first one.
        </p>
      )}

      {images && images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group overflow-hidden rounded-lg border"
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={image.image_url}
                  alt={image.caption || "Gallery image"}
                  className="h-full w-full object-cover"
                />
                <Badge className="absolute left-2 top-2">
                  #{image.sort_order}
                </Badge>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => openEdit(image)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="secondary" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove
                          {image.caption
                            ? ` "${image.caption}"`
                            : " the image"}{" "}
                          from the public gallery. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(image.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="truncate p-2 text-sm">
                {image.caption || (
                  <span className="text-muted-foreground">No caption</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      <GalleryImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        image={editing}
      />
    </div>
  );
}
