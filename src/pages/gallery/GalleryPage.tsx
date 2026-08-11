import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Images, Pencil, Plus, Trash2 } from "lucide-react";
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
import { galleryApi, type GalleryAlbum } from "@/lib/api";
import { GalleryAlbumDialog } from "@/pages/gallery/GalleryAlbumDialog";

export function GalleryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryAlbum | undefined>(undefined);

  const { data: albums, isLoading, isError, error } = useQuery({
    queryKey: ["gallery"],
    queryFn: galleryApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: galleryApi.remove,
    onSuccess: () => {
      toast.success("Album deleted");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const openAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (album: GalleryAlbum) => {
    setEditing(album);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Manage the image gallery shown on the public site. An album can hold a
            single image or many.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add album
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

      {albums && albums.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No albums yet. Click "Add album" to add the first one.
        </p>
      )}

      {albums && albums.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => {
            const count = album.images.length;
            return (
              <div
                key={album.id}
                className="group overflow-hidden rounded-lg border"
              >
                <div className="relative aspect-video bg-muted">
                  <img
                    src={album.images[0]?.image_url}
                    alt={album.title || "Gallery album"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <Badge className="absolute left-2 top-2">
                    #{album.sort_order}
                  </Badge>
                  {count > 1 && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 gap-1"
                    >
                      <Images className="h-3 w-3" />
                      {count}
                    </Badge>
                  )}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => openEdit(album)}
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
                          <AlertDialogTitle>Delete this album?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove
                            {album.title ? ` "${album.title}"` : " the album"} and
                            its {count} {count === 1 ? "image" : "images"} from the
                            public gallery. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(album.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="truncate p-2 text-sm">
                  {album.title || (
                    <span className="text-muted-foreground">Untitled album</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <GalleryAlbumDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        album={editing}
      />
    </div>
  );
}
