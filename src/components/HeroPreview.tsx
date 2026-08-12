import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/** Only what the preview needs, so it works for saved slides and unsaved drafts. */
export interface HeroPreviewSlide {
  image_url: string;
  title: string;
  subtitle: string;
}

interface HeroPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: HeroPreviewSlide[];
  /** Index to open on, so "preview" from a single slide starts on that slide. */
  startAt?: number;
}

/**
 * Reproduces the homepage hero — same 16:9 crop, gradient and type scale as
 * kunphen-frontend/src/components/HeroSlider.tsx — so an editor can see the
 * actual framing before publishing. Keep the two in step when either changes.
 */
export function HeroPreview({
  open,
  onOpenChange,
  slides,
  startAt = 0,
}: HeroPreviewProps) {
  const [current, setCurrent] = useState(startAt);

  const slide = slides[current];

  const navigate = useCallback(
    (dir: number) => {
      const count = slides.length;
      if (count === 0) return;
      setCurrent((prev) => (prev + dir + count) % count);
    },
    [slides.length]
  );

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (open) setCurrent(startAt);
  }, [open, startAt]);

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

  if (!open || !slide) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Hero slider preview"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 overflow-y-auto bg-foreground/95 p-4"
      onClick={close}
    >
      <button
        onClick={close}
        className="absolute right-4 top-4 z-10 text-primary-foreground/80 hover:text-primary-foreground"
        aria-label="Close"
      >
        <X className="h-8 w-8" />
      </button>

      <div
        className="w-full max-w-5xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Badge variant="secondary">Preview Mode</Badge>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={current}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              src={slide.image_url}
              alt={slide.title || `Slide ${current + 1}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>

          {/* Same overlay the website paints over the slide */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/40 to-foreground/70" />

          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground drop-shadow-lg md:text-5xl">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-lg">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>

          {slides.length > 1 && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-background/40"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-background/40"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === current}
                    className={`h-2.5 rounded-full transition-all ${
                      i === current
                        ? "w-8 bg-accent"
                        : "w-2.5 bg-primary-foreground/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-primary-foreground/60">
          The live hero fills the browser width at 70–85vh, so the top and bottom
          of a 16:9 image are cropped further on tall screens.
          {slides.length > 1 && ` · ${current + 1} / ${slides.length}`}
        </p>
      </div>
    </motion.div>
  );
}
