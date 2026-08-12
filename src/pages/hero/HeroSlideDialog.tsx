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
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { heroSlidesApi, type HeroSlide, type HeroSlideInput } from "@/lib/api";
import { HERO_IMAGE_SPEC } from "@/lib/images";

const EMPTY_FORM: HeroSlideInput = {
  image_url: "",
  title: "",
  subtitle: "",
  is_active: true,
};

interface HeroSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide?: HeroSlide;
}

export function HeroSlideDialog({
  open,
  onOpenChange,
  slide,
}: HeroSlideDialogProps) {
  const isEdit = slide !== undefined;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HeroSlideInput>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        slide
          ? {
              image_url: slide.image_url,
              title: slide.title,
              subtitle: slide.subtitle,
              is_active: slide.is_active,
            }
          : EMPTY_FORM,
      );
    }
  }, [open, slide]);

  const saveMutation = useMutation({
    mutationFn: (data: HeroSlideInput) =>
      isEdit ? heroSlidesApi.update(slide.id, data) : heroSlidesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Slide updated" : "Slide added");
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const canSave = form.image_url !== "" && !saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit slide" : "Add slide"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this homepage hero slide."
              : "Add a new slide to the homepage hero slider."}
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
              spec={HERO_IMAGE_SPEC}
            />
            {form.image_url === "" && (
              <p className="text-xs text-destructive">
                Upload a 16:9 image for the slide
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ancient Healing Wisdom"
            />
            <p className="text-xs text-muted-foreground">
              The large heading shown over the slide.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={form.subtitle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, subtitle: e.target.value }))
              }
              placeholder="Rooted in centuries of Tibetan medical tradition"
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2.5 rounded-md border p-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Active</span>
              <span className="ml-2 text-muted-foreground">
                Inactive slides stay here but don't show on the site.
              </span>
            </span>
          </label>

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
                  : "Add slide"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
