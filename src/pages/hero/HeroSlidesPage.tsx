import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { HeroPreview } from "@/components/HeroPreview";
import { heroSlidesApi, type HeroSlide } from "@/lib/api";
import { HeroSlideDialog } from "@/pages/hero/HeroSlideDialog";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder.svg";

interface SlideCardProps {
  slide: HeroSlide;
  index: number;
  onEdit: (slide: HeroSlide) => void;
  onDelete: (id: number) => void;
}

function SlideCard({ slide, index, onEdit, onDelete }: SlideCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group overflow-hidden rounded-lg border bg-card",
        isDragging && "z-10 opacity-80 shadow-lg",
        !slide.is_active && "opacity-70",
      )}
    >
      <div className="relative aspect-video bg-muted">
        <img
          src={slide.image_url}
          alt={slide.title || `Slide ${index + 1}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
              e.currentTarget.src = PLACEHOLDER;
            }
          }}
        />
        {/* Gradient echoes the live hero so the card reads like a real slide */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/10 via-foreground/20 to-foreground/50" />

        <Badge className="absolute left-2 top-2">#{index + 1}</Badge>
        {!slide.is_active && (
          <Badge variant="secondary" className="absolute left-2 top-9">
            Inactive
          </Badge>
        )}

        <button
          type="button"
          className="absolute bottom-2 left-2 cursor-grab rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label={`Reorder slide ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button variant="secondary" size="icon" onClick={() => onEdit(slide)}>
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
                <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove
                  {slide.title ? ` "${slide.title}"` : " the slide"} from the
                  homepage hero slider. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(slide.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="truncate font-display text-sm font-semibold text-primary-foreground drop-shadow">
            {slide.title || (
              <span className="italic text-primary-foreground/70">
                No title
              </span>
            )}
          </p>
          {slide.subtitle && (
            <p className="truncate text-xs text-primary-foreground/80 drop-shadow">
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeroSlidesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: slides, isLoading, isError, error } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: heroSlidesApi.list,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const deleteMutation = useMutation({
    mutationFn: heroSlidesApi.remove,
    onSuccess: () => {
      toast.success("Slide deleted");
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const reorderMutation = useMutation({
    mutationFn: heroSlidesApi.reorder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] }),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
      // Drop the optimistic order and reload the server's truth.
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const openAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setDialogOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !slides) return;

    const from = slides.findIndex((s) => s.id === active.id);
    const to = slides.findIndex((s) => s.id === over.id);
    if (from === -1 || to === -1) return;

    const next = arrayMove(slides, from, to);
    // Optimistic: paint the new order now, then persist it.
    queryClient.setQueryData(["hero-slides"], next);
    reorderMutation.mutate(next.map((s) => s.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hero slider</h1>
          <p className="text-sm text-muted-foreground">
            Manage the sliding images shown at the top of the homepage.
          </p>
        </div>
        <div className="flex gap-2">
          {slides && slides.length > 0 && (
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
              Preview slider
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add slide
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
          Failed to load hero slides:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {slides && slides.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No slides yet. Click "Add slide" to add the first one.
        </p>
      )}

      {slides && slides.length > 0 && (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map((s) => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slides.map((slide, index) => (
                  <SlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    onEdit={openEdit}
                    onDelete={deleteMutation.mutate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {slides.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Drag the grip handle to reorder. Slides play top-to-bottom on the
              homepage.
            </p>
          )}
        </>
      )}

      <HeroSlideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        slide={editing}
      />

      <HeroPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        slides={(slides ?? []).filter((s) => s.is_active)}
      />
    </div>
  );
}
