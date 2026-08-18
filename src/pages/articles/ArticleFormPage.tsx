import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { articlesApi, type ArticleInput } from "@/lib/api";

const EMPTY_FORM: ArticleInput = {
  title: "",
  slug: "",
  category: "",
  author: "",
  excerpt: "",
  content: "",
  image_url: "",
  published_at: null,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ArticleFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ArticleInput>(EMPTY_FORM);
  const [publishedAtInput, setPublishedAtInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [contentTab, setContentTab] = useState<"write" | "preview">("write");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["articles", id],
    queryFn: () => articlesApi.get(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        slug: existing.slug,
        category: existing.category,
        author: existing.author,
        excerpt: existing.excerpt,
        content: existing.content,
        image_url: existing.image_url,
        published_at: existing.published_at,
      });
      setPublishedAtInput(toLocalInputValue(existing.published_at));
      setSlugTouched(true);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data: ArticleInput) =>
      isEdit ? articlesApi.update(Number(id), data) : articlesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Article updated" : "Article created");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      navigate("/articles");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let publishedAt: string | null = publishedAtInput
      ? new Date(publishedAtInput).toISOString()
      : null;
    if (isEdit && publishedAt === null && existing) {
      publishedAt = existing.published_at;
    }
    saveMutation.mutate({ ...form, published_at: publishedAt });
  };

  const set = (field: keyof ArticleInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/articles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit article" : "Add article"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Article details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="The benefits of Sowa Rigpa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="benefits-of-sowa-rigpa"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={set("category")}
                  placeholder="News"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={set("author")}
                  placeholder="Dr. Pema Yangchen"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="published_at">Published at</Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={publishedAtInput}
                onChange={(e) => setPublishedAtInput(e.target.value)}
              />
              {!isEdit && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to publish immediately.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={2}
                value={form.excerpt}
                onChange={set("excerpt")}
                placeholder="Short summary shown in article listings..."
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                value={form.image_url}
                onChange={(url) =>
                  setForm((prev) => ({ ...prev, image_url: url }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Content (Markdown)</Label>
                <div className="flex gap-1 rounded-md border p-0.5">
                  <button
                    type="button"
                    onClick={() => setContentTab("write")}
                    className={cn(
                      "rounded-sm px-3 py-1 text-xs font-medium",
                      contentTab === "write"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab("preview")}
                    className={cn(
                      "rounded-sm px-3 py-1 text-xs font-medium",
                      contentTab === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Preview
                  </button>
                </div>
              </div>
              {contentTab === "write" ? (
                <Textarea
                  id="content"
                  rows={14}
                  value={form.content}
                  onChange={set("content")}
                  placeholder="Write the article in Markdown..."
                />
              ) : (
                <div className="min-h-48 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:space-y-1">
                  {form.content ? (
                    <ReactMarkdown>{form.content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link to="/articles">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Save changes"
                    : "Create article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
