import { useCallback, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { uploadImageToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_IMAGE_HINT,
  ACCEPTED_IMAGE_TYPES,
  validateImage,
  type ImageSpec,
} from "@/lib/images";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder.svg";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  /** Shape requirement for the slot this image fills. Without it, any image goes. */
  spec?: ImageSpec;
}

export function ImageUpload({
  value,
  onChange,
  className,
  spec,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      // Dimensions are checked before the presign call, so a wrongly-shaped image
      // never reaches the bucket (nothing here can delete it again).
      const { error, warning } = await validateImage(file, spec);
      if (error) {
        toast.error(error);
        return;
      }

      setIsUploading(true);
      try {
        const url = await uploadImageToS3(file);
        onChange(url);
        toast.success("Image uploaded successfully");
        if (warning) toast.warning(warning);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, spec]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onChange("");
  }, [onChange]);

  if (value) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg border", className)}>
        <img
          src={value}
          alt="Uploaded"
          // With a spec, the preview is shown at the exact shape the site renders it.
          style={spec ? { aspectRatio: spec.ratio } : undefined}
          className={cn("w-full object-cover", !spec && "h-48")}
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
              e.currentTarget.src = PLACEHOLDER;
            }
          }}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2"
          onClick={handleRemove}
          disabled={isUploading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        isUploading && "opacity-50",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleFileInput}
        disabled={isUploading}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      {isUploading ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            Drop an image here or click to browse
          </p>
          {spec && (
            <p className="mt-1 text-xs font-medium text-primary">
              Must be {spec.label}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {ACCEPTED_IMAGE_HINT}
          </p>
        </>
      )}
    </div>
  );
}
