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
import { galleryApi, type GalleryImage, type GalleryImageInput } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";

const EMPTY_FORM: GalleryImageInput = {
  image_url: "",
  caption: "",
  sort_order: 0,
};

interface GalleryImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image?: GalleryImage;
}

export function GalleryImageDialog({
  open,
  onOpenChange,
  image,
}: GalleryImageDialogProps) {
  const isEdit = image !== undefined;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GalleryImageInput>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        image
          ? {
              image_url: image.image_url,
              caption: image.caption,
              sort_order: image.sort_order,
            }
          : EMPTY_FORM,
      );
    }
  }, [open, image]);

  const saveMutation = useMutation({
    mutationFn: (data: GalleryImageInput) =>
      isEdit ? galleryApi.update(image.id, data) : galleryApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Image updated" : "Image added");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit image" : "Add image"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this gallery image."
              : "Add a new image to the public gallery."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Image *</Label>
            <ImageUpload
              value={form.image_url}
              onChange={(url) =>
                setForm((prev) => ({ ...prev, image_url: url }))
              }
            />
            {!form.image_url && (
              <p className="text-xs text-destructive">
                Please upload an image
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={form.caption}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="Medicine preparation workshop"
            />
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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Add image"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
