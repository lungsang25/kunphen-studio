import { useCallback, useState } from "react";
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
import { GripVertical, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { uploadImagesToS3 } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_IMAGE_HINT,
  ACCEPTED_IMAGE_TYPES,
  validateImageFile,
} from "@/lib/images";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder.svg";

export interface ImageDraft {
  /** Client-side id. Image rows are recreated server-side on every save, so their
   *  database ids can't be used as a stable key for sorting. */
  uid: string;
  image_url: string;
  caption: string;
}

export function newImageDraft(image_url: string, caption = ""): ImageDraft {
  return { uid: crypto.randomUUID(), image_url, caption };
}

interface SortableTileProps {
  image: ImageDraft;
  index: number;
  onCaptionChange: (caption: string) => void;
  onRemove: () => void;
}

function SortableTile({
  image,
  index,
  onCaptionChange,
  onRemove,
}: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.uid });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative rounded-lg border bg-card",
        isDragging && "z-10 opacity-80 shadow-lg"
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
        <img
          src={image.image_url}
          alt={image.caption || `Image ${index + 1}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
              e.currentTarget.src = PLACEHOLDER;
            }
          }}
        />

        {index === 0 ? (
          <Badge className="absolute left-1.5 top-1.5">Cover</Badge>
        ) : (
          <Badge variant="secondary" className="absolute left-1.5 top-1.5">
            {index + 1}
          </Badge>
        )}

        <button
          type="button"
          className="absolute bottom-1.5 left-1.5 cursor-grab rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label={`Reorder image ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={onRemove}
          aria-label={`Remove image ${index + 1}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-1.5">
        <Input
          value={image.caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Caption (optional)"
          className="h-8 text-xs"
          aria-label={`Caption for image ${index + 1}`}
        />
      </div>
    </div>
  );
}

interface MultiImageUploadProps {
  value: ImageDraft[];
  onChange: (next: ImageDraft[]) => void;
  className?: string;
}

export function MultiImageUpload({
  value,
  onChange,
  className,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);

  const sensors = useSensors(
    // A small distance threshold keeps a click on the caption input or the remove
    // button from being swallowed as the start of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      const files: File[] = [];
      for (const file of Array.from(fileList ?? [])) {
        const problem = validateImageFile(file);
        if (problem) {
          toast.error(`${file.name}: ${problem}`);
        } else {
          files.push(file);
        }
      }
      if (files.length === 0) return;

      setUploadingNames((prev) => [...prev, ...files.map((f) => f.name)]);
      try {
        const results = await uploadImagesToS3(files);

        // Results are index-aligned with `files`, so appending in order preserves the
        // order the images were picked in regardless of which upload finished first.
        const uploaded = results.flatMap((result) =>
          result.status === "fulfilled" ? [newImageDraft(result.value)] : []
        );
        const failed = results.length - uploaded.length;

        if (uploaded.length > 0) onChange([...value, ...uploaded]);
        if (failed > 0) {
          toast.error(
            failed === 1 ? "1 image failed to upload" : `${failed} images failed to upload`
          );
        }
        if (uploaded.length > 0) {
          toast.success(
            uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`
          );
        }
      } finally {
        setUploadingNames((prev) => prev.slice(files.length));
      }
    },
    [onChange, value]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const from = value.findIndex((img) => img.uid === active.id);
      const to = value.findIndex((img) => img.uid === over.id);
      if (from === -1 || to === -1) return;

      onChange(arrayMove(value, from, to));
    },
    [onChange, value]
  );

  const isUploading = uploadingNames.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {(value.length > 0 || isUploading) && (
        <div className="max-h-[45vh] overflow-y-auto rounded-lg border bg-muted/30 p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={value.map((img) => img.uid)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {value.map((image, index) => (
                  <SortableTile
                    key={image.uid}
                    image={image}
                    index={index}
                    onCaptionChange={(caption) =>
                      onChange(
                        value.map((img) =>
                          img.uid === image.uid ? { ...img, caption } : img
                        )
                      )
                    }
                    onRemove={() =>
                      onChange(value.filter((img) => img.uid !== image.uid))
                    }
                  />
                ))}

                {uploadingNames.map((name, i) => (
                  <div
                    key={`uploading-${i}-${name}`}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/50 p-2"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="w-full truncate text-center text-[10px] text-muted-foreground">
                      {name}
                    </p>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "opacity-50"
        )}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={isUploading}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="h-7 w-7 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">
          {value.length > 0
            ? "Drop more images here or click to browse"
            : "Drop images here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Select several at once — {ACCEPTED_IMAGE_HINT}
        </p>
      </div>

      {value.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag the thumbnails to reorder. The first image is the album cover.
        </p>
      )}
    </div>
  );
}
