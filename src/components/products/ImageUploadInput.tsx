import { useState, useRef } from "react";
import { ImagePlus, Link as LinkIcon, Upload, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadInput({ value, onChange }: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product_images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product_images").getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Image uploaded!" });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-body">Product Image</Label>
        <button
          type="button"
          onClick={() => setMode(mode === "upload" ? "url" : "upload")}
          className="text-xs font-body text-primary hover:underline"
        >
          {mode === "upload" ? "Use URL instead" : "Upload file instead"}
        </button>
      </div>

      {value ? (
        <div className="relative rounded-xl border border-border bg-muted/30 p-4">
          <img src={value} alt="Preview" className="mx-auto h-32 w-32 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : mode === "upload" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"}`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-body text-sm text-muted-foreground">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="font-body text-sm font-medium text-foreground">Drop image here or click to browse</p>
              <p className="font-body text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://images.unsplash.com/..." className="font-body text-sm" />
        </div>
      )}
    </div>
  );
}
