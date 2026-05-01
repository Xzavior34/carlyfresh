/**
 * Blog Post detail — markdown body, like button, comments thread.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, MessageCircle, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}
interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const loadAll = async (postId: string) => {
    const [likesRes, commentsRes, likedRes] = await Promise.all([
      supabase.from("blog_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
      supabase.from("blog_comments").select("id,author_id,content,created_at").eq("post_id", postId).order("created_at", { ascending: false }),
      user ? supabase.from("blog_likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    setLikes(likesRes.count ?? 0);
    setLiked(!!likedRes.data);

    const cs = commentsRes.data ?? [];
    if (cs.length) {
      const ids = Array.from(new Set(cs.map((c) => c.author_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const nameMap = new Map((profs ?? []).map((p) => [p.user_id, p.full_name || "User"]));
      setComments(cs.map((c) => ({ ...c, author_name: nameMap.get(c.author_id) })));
    } else {
      setComments([]);
    }
  };

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(async ({ data }) => {
        if (!mounted) return;
        setPost(data as Post | null);
        if (data) await loadAll(data.id);
        setLoading(false);
      });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id]);

  // Realtime: refresh likes & comments
  useEffect(() => {
    if (!post) return;
    const channel = supabase
      .channel(`blog-${post.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_likes", filter: `post_id=eq.${post.id}` }, () => loadAll(post.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_comments", filter: `post_id=eq.${post.id}` }, () => loadAll(post.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const handleLike = async () => {
    if (!user) { toast.error("Please log in to like posts"); return; }
    if (!post) return;
    if (liked) {
      await supabase.from("blog_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("blog_likes").insert({ post_id: post.id, user_id: user.id });
    }
  };

  const handleComment = async () => {
    if (!user) { toast.error("Please log in to comment"); return; }
    if (!post || !newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("blog_comments").insert({
      post_id: post.id, author_id: user.id, content: newComment.trim(),
    });
    if (error) toast.error("Failed to post comment");
    else { setNewComment(""); toast.success("Comment posted"); }
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 container mx-auto px-6 max-w-3xl">
          <div className="h-8 w-1/2 bg-muted rounded animate-pulse mb-4" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 container mx-auto px-6 max-w-3xl text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Post not found</h1>
          <Link to="/blog" className="text-primary font-body mt-4 inline-block">← Back to Blog</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-6 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">{post.title}</h1>
          <div className="flex items-center gap-3 mt-4 text-sm font-body text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
          </div>

          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              loading="lazy"
              className="w-full aspect-[16/9] object-cover rounded-xl mt-6"
            />
          )}

          <div className="prose prose-lg max-w-none font-body text-foreground mt-8 whitespace-pre-wrap">
            {post.body}
          </div>

          {/* Engagement bar */}
          <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border">
            <Button
              onClick={handleLike}
              variant={liked ? "default" : "outline"}
              size="sm"
              className="gap-2 font-body"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likes} {likes === 1 ? "Like" : "Likes"}
            </Button>
            <span className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
            </span>
          </div>

          {/* Comments */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Comments</h2>
            {user ? (
              <div className="space-y-3 mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts…"
                  rows={3}
                  className="font-body"
                />
                <Button onClick={handleComment} disabled={posting || !newComment.trim()} className="font-body gap-2">
                  {posting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Post Comment
                </Button>
              </div>
            ) : (
              <p className="font-body text-sm text-muted-foreground mb-6">
                <Link to="/login" className="text-primary underline">Log in</Link> to leave a comment.
              </p>
            )}

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-4 bg-card">
                  <div className="flex items-center gap-2 text-sm font-body">
                    <span className="font-semibold text-foreground">{c.author_name || "User"}</span>
                    <span className="text-muted-foreground">· {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-body text-sm text-foreground mt-2 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="font-body text-sm text-muted-foreground">Be the first to comment.</p>
              )}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
