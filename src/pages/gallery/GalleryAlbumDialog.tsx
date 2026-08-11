import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { galleryApi, type GalleryAlbum, type GalleryAlbumInput } from "@/lib/api";
import {
  MultiImageUpload,
  newImageDraft,
  type ImageDraft,
} from "@/components/MultiImageUpload";

interface AlbumForm {
  title: string;
  sort_order: number;
  images: ImageDraft[];
}

const EMPTY_FORM: AlbumForm = {
  title: "",
  sort_order: 0,
  images: [],
};

interface GalleryAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album?: GalleryAlbum;
}

export function GalleryAlbumDialog({
  open,
  onOpenChange,
  album,
}: GalleryAlbumDialogProps) {
  const isEdit = album !== undefined;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AlbumForm>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        album
          ? {
              title: album.title,
              sort_order: album.sort_order,
              images: album.images.map((img) =>
                newImageDraft(img.image_url, img.caption),
              ),
            }
          : EMPTY_FORM,
      );
    }
  }, [open, album]);

  const saveMutation = useMutation({
    mutationFn: (data: GalleryAlbumInput) =>
      isEdit ? galleryApi.update(album.id, data) : galleryApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Album updated" : "Album added");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      title: form.title,
      sort_order: form.sort_order,
      // Drop the client-side uid; position in this list is the album order.
      images: form.images.map(({ image_url, caption }) => ({ image_url, caption })),
    });
  };

  const canSave = form.images.length > 0 && !saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit album" : "Add album"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this gallery album."
              : "Add one or more images to the public gallery as a single album."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Medicine preparation workshop"
            />
            <p className="text-xs text-muted-foreground">
              Shown on the gallery card and above the caption in the viewer.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Images *</Label>
            <MultiImageUpload
              value={form.images}
              onChange={(images) => setForm((prev) => ({ ...prev, images }))}
            />
            {form.images.length === 0 && (
              <p className="text-xs text-destructive">
                Add at least one image — the first one becomes the cover
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the gallery.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {saveMutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Add album"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
