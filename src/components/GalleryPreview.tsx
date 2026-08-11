import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ImageDraft } from "@/components/MultiImageUpload";

interface GalleryPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  images: ImageDraft[];
}

export function GalleryPreview({
  open,
  onOpenChange,
  title,
  images,
}: GalleryPreviewProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const openImage = images[currentImage];

  const navigate = useCallback(
    (dir: number) => {
      const count = images.length;
      if (count === 0) return;
      setCurrentImage((prev) => (prev + dir + count) % count);
    },
    [images.length]
  );

  const close = useCallback(() => {
    onOpenChange(false);
    setCurrentImage(0);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "ArrowRight") navigate(1);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close, navigate]);

  if (!open || !openImage) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Gallery preview"}
      className="fixed inset-0 z-[100] bg-foreground/95 overflow-y-auto"
      onClick={close}
    >
      <button
        onClick={close}
        className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground z-10"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      <div
        className="min-h-full mx-auto max-w-7xl flex flex-col lg:flex-row lg:items-center gap-6 p-4 pt-16 lg:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image pane */}
        <div className="relative flex-1 flex items-center justify-center min-w-0">
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-background/20 backdrop-blur-sm hover:bg-background/40 text-primary-foreground transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-background/20 backdrop-blur-sm hover:bg-background/40 text-primary-foreground transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}

          <motion.img
            key={currentImage}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            src={openImage.image_url}
            alt={openImage.caption || title}
            className="max-w-full max-h-[55vh] lg:max-h-[85vh] w-auto object-contain rounded-lg"
          />
        </div>

        {/* Caption panel */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 text-primary-foreground">
          <Badge variant="secondary" className="mb-3">
            Preview Mode
          </Badge>
          {title && (
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              {title}
            </h2>
          )}
          <div className="h-px bg-primary-foreground/20 my-4" />

          {openImage.caption ? (
            <p className="font-body text-primary-foreground/80 leading-relaxed">
              {openImage.caption}
            </p>
          ) : (
            <p className="font-body text-primary-foreground/40 italic text-sm">
              No caption for this photo.
            </p>
          )}

          {images.length > 1 && (
            <>
              <p className="mt-6 text-sm text-primary-foreground/60">
                {currentImage + 1} / {images.length}
              </p>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
                {images.map((img, index) => (
                  <button
                    key={img.uid}
                    onClick={() => setCurrentImage(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-current={index === currentImage}
                    className={`shrink-0 w-14 h-14 rounded-md overflow-hidden transition-opacity ${
                      index === currentImage
                        ? "ring-2 ring-accent"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
