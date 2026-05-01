-- 1. Blog tables
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_posts_status_pub ON public.blog_posts(status, published_at DESC);

CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_comments_post ON public.blog_comments(post_id, created_at DESC);

CREATE TABLE public.blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Blog posts policies
CREATE POLICY "Posts public read published" ON public.blog_posts
  FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Posts admin insert" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Posts admin update" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Posts admin delete" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Comments policies
CREATE POLICY "Comments public read" ON public.blog_comments
  FOR SELECT USING (true);
CREATE POLICY "Comments insert own" ON public.blog_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Comments delete own or admin" ON public.blog_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- Likes policies
CREATE POLICY "Likes public read" ON public.blog_likes
  FOR SELECT USING (true);
CREATE POLICY "Likes insert own" ON public.blog_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Likes delete own" ON public.blog_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Storage bucket for blog covers
INSERT INTO storage.buckets (id, name, public) VALUES ('blog_covers','blog_covers', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Blog covers public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog_covers');
CREATE POLICY "Blog covers admin write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog_covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Blog covers admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'blog_covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Blog covers admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'blog_covers' AND public.has_role(auth.uid(), 'admin'));

-- 3. driver_rating on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_rating NUMERIC NOT NULL DEFAULT 5.0;

-- 4. Extend job_status enum and delivery_jobs columns for SLA + claim flow
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'awaiting_supplier';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'awaiting_driver';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'supplier_missed';

ALTER TABLE public.delivery_jobs
  ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;

-- 5. Order SLA timestamps
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_response_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_assignment_deadline TIMESTAMPTZ;

-- 6. Enable extensions for cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;