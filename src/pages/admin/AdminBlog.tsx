/**
 * Admin Blog CMS — create / edit / publish / delete posts.
 */
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export default function AdminBlog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [broadcast, setBroadcast] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const ch = supabase
      .channel("admin-blog")
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_posts" }, fetchPosts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const openNew = () => setEditing({ title: "", slug: "", excerpt: "", body: "", status: "draft", cover_image_url: null });
  const openEdit = (p: Post) => setEditing({ ...p });

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `${user?.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog_covers").upload(path, file, { upsert: false });
    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      const { data: pub } = supabase.storage.from("blog_covers").getPublicUrl(path);
      setEditing((p) => ({ ...(p ?? {}), cover_image_url: pub.publicUrl }));
      toast.success("Cover uploaded");
    }
    setUploadingCover(false);
  };

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.title?.trim()) { toast.error("Title is required"); return; }
    setSaving(true);

    const slug = editing.slug?.trim() || slugify(editing.title);
    const payload = {
      title: editing.title.trim(),
      slug,
      excerpt: editing.excerpt?.trim() ?? "",
      body: editing.body ?? "",
      cover_image_url: editing.cover_image_url ?? null,
      status: editing.status ?? "draft",
      published_at: editing.status === "published" ? (editing.published_at ?? new Date().toISOString()) : null,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert({ ...payload, author_id: user.id }));
    }

    if (error) toast.error(error.message);
    else { toast.success(editing.id ? "Post updated" : "Post created"); setEditing(null); fetchPosts(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Post deleted"); fetchPosts(); }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Blog Manager</h1>
          <p className="text-muted-foreground font-body text-sm">{posts.length} posts</p>
        </div>
        <Button onClick={openNew} className="font-body gap-2"><Plus className="h-4 w-4" /> New Post</Button>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-body text-xs uppercase">Title</TableHead>
                <TableHead className="font-body text-xs uppercase">Slug</TableHead>
                <TableHead className="font-body text-xs uppercase text-center">Status</TableHead>
                <TableHead className="font-body text-xs uppercase">Created</TableHead>
                <TableHead className="font-body text-xs uppercase text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/20">
                  <TableCell className="font-body font-medium">{p.title}</TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">/{p.slug}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`text-[10px] capitalize ${p.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {p.status === "published" && (
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 font-body text-xs gap-1">
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /> View</a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 font-body text-xs gap-1" onClick={() => openEdit(p)}>
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive font-body text-xs gap-1" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <FileText className="h-7 w-7 text-primary" />
                      </div>
                      <p className="font-display text-base font-semibold text-foreground mb-1">No blog posts yet</p>
                      <p className="font-body text-sm text-muted-foreground">Click "New Post" to publish your first article.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing?.id ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="font-body text-xs uppercase tracking-wide text-muted-foreground">Title</label>
              <Input
                value={editing?.title ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), title: e.target.value, slug: p?.slug || slugify(e.target.value) }))}
                className="font-body mt-1"
                placeholder="A great post title"
              />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wide text-muted-foreground">Slug</label>
              <Input
                value={editing?.slug ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), slug: slugify(e.target.value) }))}
                className="font-body mt-1"
                placeholder="post-url-slug"
              />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wide text-muted-foreground">Excerpt</label>
              <Textarea
                value={editing?.excerpt ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), excerpt: e.target.value }))}
                className="font-body mt-1"
                rows={2}
                placeholder="Short summary shown in listings"
              />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wide text-muted-foreground">Body</label>
              <Textarea
                value={editing?.body ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), body: e.target.value }))}
                className="font-body mt-1 min-h-[240px]"
                placeholder="Full article body (plain text or markdown)"
              />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wide text-muted-foreground">Cover Image</label>
              <div className="mt-1 flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                  className="font-body"
                  disabled={uploadingCover}
                />
                {uploadingCover && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {editing?.cover_image_url && (
                <img src={editing.cover_image_url} alt="cover" className="mt-3 w-full max-w-sm rounded-md border border-border" />
              )}
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wide text-muted-foreground">Status</label>
              <select
                value={editing?.status ?? "draft"}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), status: e.target.value as "draft" | "published" }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-body"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="font-body">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="font-body gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
