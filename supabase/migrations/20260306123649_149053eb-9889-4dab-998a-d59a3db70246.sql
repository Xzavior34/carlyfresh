
-- Fix all RLS policies to be PERMISSIVE (OR logic) instead of RESTRICTIVE (AND logic)
-- This is critical: with RESTRICTIVE, ALL policies must pass simultaneously,
-- meaning a buyer can never see their own orders because the admin policy also requires admin role.

-- ==================== PRODUCTS ====================
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins full access products insert" ON public.products;
DROP POLICY IF EXISTS "Admins full access products update" ON public.products;
DROP POLICY IF EXISTS "Admins full access products delete" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Sellers can manage own products insert" ON public.products FOR INSERT TO authenticated WITH CHECK ((auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'::app_role)) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Sellers can manage own products update" ON public.products FOR UPDATE TO authenticated USING ((auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'::app_role)) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Sellers can manage own products delete" ON public.products FOR DELETE TO authenticated USING ((auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'::app_role)) OR has_role(auth.uid(), 'admin'::app_role));

-- ==================== ORDERS ====================
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
DROP POLICY IF EXISTS "Admins full access orders select" ON public.orders;
DROP POLICY IF EXISTS "Admins full access orders insert" ON public.orders;
DROP POLICY IF EXISTS "Admins full access orders update" ON public.orders;
DROP POLICY IF EXISTS "Admins full access orders delete" ON public.orders;

CREATE POLICY "Orders select" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Orders update" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Orders delete" ON public.orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== DELIVERY_JOBS ====================
DROP POLICY IF EXISTS "Drivers can view jobs" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Drivers can accept jobs" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Sellers can create delivery jobs" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Admins full access jobs select" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Admins full access jobs insert" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Admins full access jobs update" ON public.delivery_jobs;
DROP POLICY IF EXISTS "Admins full access jobs delete" ON public.delivery_jobs;

CREATE POLICY "Jobs select" ON public.delivery_jobs FOR SELECT TO authenticated USING ((status = 'available'::job_status AND has_role(auth.uid(), 'driver'::app_role)) OR driver_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jobs insert" ON public.delivery_jobs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jobs update" ON public.delivery_jobs FOR UPDATE TO authenticated USING ((status = 'available'::job_status AND has_role(auth.uid(), 'driver'::app_role)) OR driver_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jobs delete" ON public.delivery_jobs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access profiles update" ON public.profiles;

CREATE POLICY "Profiles select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- ==================== USER_ROLES ====================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins full access roles select" ON public.user_roles;
DROP POLICY IF EXISTS "Admins full access roles update" ON public.user_roles;

CREATE POLICY "Roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Roles insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Roles update" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== TRIGGERS ====================
-- Create handle_new_user trigger (auto-creates profile + role on signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create delivery job trigger (auto-creates delivery job on new order)
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_delivery_job_on_order();
