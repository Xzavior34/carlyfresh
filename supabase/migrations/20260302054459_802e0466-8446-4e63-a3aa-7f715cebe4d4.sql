
-- Fix all RLS policies from RESTRICTIVE to PERMISSIVE

-- PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
CREATE POLICY "Sellers can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'));

DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
CREATE POLICY "Sellers can update their own products" ON public.products FOR UPDATE USING (auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'));

DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
CREATE POLICY "Sellers can delete their own products" ON public.products FOR DELETE USING (auth.uid() = vendor_id AND has_role(auth.uid(), 'seller'));

-- ORDERS
DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.orders;
CREATE POLICY "Buyers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
CREATE POLICY "Sellers can view their orders" ON public.orders FOR SELECT USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE USING (auth.uid() = vendor_id);

-- DELIVERY JOBS
DROP POLICY IF EXISTS "Drivers can view available jobs" ON public.delivery_jobs;
CREATE POLICY "Drivers can view available jobs" ON public.delivery_jobs FOR SELECT USING ((status = 'available' AND has_role(auth.uid(), 'driver')) OR driver_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can accept jobs" ON public.delivery_jobs;
CREATE POLICY "Drivers can accept jobs" ON public.delivery_jobs FOR UPDATE USING ((status = 'available' AND has_role(auth.uid(), 'driver')) OR driver_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can create delivery jobs" ON public.delivery_jobs;
CREATE POLICY "Sellers can create delivery jobs" ON public.delivery_jobs FOR INSERT WITH CHECK (has_role(auth.uid(), 'seller'));

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
