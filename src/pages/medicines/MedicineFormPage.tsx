import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { medicinesApi, type MedicineInput } from "@/lib/api";

const EMPTY_FORM: MedicineInput = {
  name: "",
  tibetan_name: "",
  description: "",
  full_description: "",
  image_url: "",
  uses: [],
};

export function MedicineFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<MedicineInput>(EMPTY_FORM);
  const [usesText, setUsesText] = useState("");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["medicines", id],
    queryFn: () => medicinesApi.get(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        tibetan_name: existing.tibetan_name,
        description: existing.description,
        full_description: existing.full_description,
        image_url: existing.image_url,
        uses: existing.uses,
      });
      setUsesText(existing.uses.join(", "));
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data: MedicineInput) =>
      isEdit ? medicinesApi.update(Number(id), data) : medicinesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Medicine updated" : "Medicine created");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      navigate("/medicines");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uses = usesText
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    saveMutation.mutate({ ...form, uses });
  };

  const set = (field: keyof MedicineInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
          <Link to="/medicines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit medicine" : "Add medicine"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medicine details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Agar-35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tibetan_name">Tibetan name</Label>
                <Input
                  id="tibetan_name"
                  value={form.tibetan_name}
                  onChange={set("tibetan_name")}
                  placeholder="ཨ་གར་སོ་ལྔ།"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={set("description")}
                placeholder="A calming formula for stress and anxiety."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_description">Full description</Label>
              <Textarea
                id="full_description"
                rows={5}
                value={form.full_description}
                onChange={set("full_description")}
                placeholder="Detailed description shown on the medicine page..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={form.image_url}
                onChange={set("image_url")}
                placeholder="https://... or /placeholder.svg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uses">Uses (comma-separated)</Label>
              <Input
                id="uses"
                value={usesText}
                onChange={(e) => setUsesText(e.target.value)}
                placeholder="Anxiety & Stress Relief, Insomnia"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link to="/medicines">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Save changes"
                    : "Create medicine"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
