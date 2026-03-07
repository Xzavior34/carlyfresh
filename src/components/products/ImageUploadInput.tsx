import { ImagePlus, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadInput({ value, onChange }: ImageUploadInputProps) {
  return (
    <div className="space-y-2">
      <Label className="font-body">Product Image</Label>
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/50">
        {value ? (
          <div className="space-y-3">
            <img
              src={value}
              alt="Preview"
              className="mx-auto h-24 w-24 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste image URL"
                className="font-body text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <ImagePlus className="h-7 w-7 text-primary" />
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Paste an image URL below
            </p>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="font-body text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}