/**
 * Public Blog feed — searchable list of published posts.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("blog_posts")
      .select("id,slug,title,excerpt,cover_image_url,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (mounted) {
          setPosts(data ?? []);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return posts;
    const needle = q.toLowerCase();
    return posts.filter(
      (p) => p.title.toLowerCase().includes(needle) || p.excerpt.toLowerCase().includes(needle),
    );
  }, [q, posts]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <header className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary">CarlyFresh Blog</h1>
            <p className="font-body text-muted-foreground mt-2">Stories, recipes, and insights from Port Harcourt's freshest marketplace.</p>
          </header>

          <div className="relative mb-8 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts by title or content…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 font-body"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 font-body text-muted-foreground">
              {posts.length === 0 ? "No posts yet — check back soon." : "No posts match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`}>
                  <Card className="overflow-hidden border border-border hover:shadow-lg transition group h-full">
                    {p.cover_image_url && (
                      <div className="aspect-[16/9] overflow-hidden bg-muted">
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(p.published_at ?? p.created_at).toLocaleDateString()}
                      </div>
                      <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {p.title}
                      </h2>
                      <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-3">{p.excerpt}</p>
                      <div className="flex items-center gap-1 text-sm font-body text-primary mt-4">
                        Read more <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
