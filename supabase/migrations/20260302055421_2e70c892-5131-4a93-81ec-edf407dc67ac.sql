
-- === PRODUCTS ===
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'::app_role));
CREATE POLICY "Sellers can update products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'::app_role));
CREATE POLICY "Sellers can delete products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'::app_role));
CREATE POLICY "Admins full access products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access products update" ON public.products FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access products delete" ON public.products FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === ORDERS ===
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;

CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view their orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Admins full access orders select" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access orders update" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access orders delete" ON public.orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === DELIVERY_JOBS ===
DROP POLICY IF EXISTS "Drivers can view available jobs" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Drivers can accept jobs" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Sellers can create delivery jobs" ON public.delivery_jobs;

CREATE POLICY "Drivers can view jobs" ON public.delivery_jobs FOR SELECT TO authenticated USING ((status = 'available'::job_status AND has_role(auth.uid(), 'driver'::app_role)) OR driver_id = auth.uid());
CREATE POLICY "Drivers can accept jobs" ON public.delivery_jobs FOR UPDATE TO authenticated USING ((status = 'available'::job_status AND has_role(auth.uid(), 'driver'::app_role)) OR driver_id = auth.uid());
CREATE POLICY "Sellers can create delivery jobs" ON public.delivery_jobs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'seller'::app_role));
CREATE POLICY "Admins full access jobs select" ON public.delivery_jobs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access jobs insert" ON public.delivery_jobs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access jobs update" ON public.delivery_jobs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access jobs delete" ON public.delivery_jobs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === PROFILES ===
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access profiles select" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access profiles update" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access roles select" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins full access roles update" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
