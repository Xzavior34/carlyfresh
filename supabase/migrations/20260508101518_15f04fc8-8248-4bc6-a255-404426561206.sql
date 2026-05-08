-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  message text NOT NULL DEFAULT '',
  link text,
  read_status boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications select own or admin" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Notifications update own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Notifications delete own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Chats
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  order_id uuid,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chats select participants" ON public.chats FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Chats insert as sender" ON public.chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE INDEX idx_chats_order ON public.chats(order_id, created_at);
CREATE INDEX idx_chats_pair ON public.chats(sender_id, receiver_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;