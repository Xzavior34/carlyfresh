
-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('sale', 'commission', 'withdrawal');

-- Create transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('completed', 'pending');

-- Create withdrawal status enum
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  type public.transaction_type NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  status public.transaction_status NOT NULL DEFAULT 'completed',
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = vendor_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own withdrawals"
  ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can create own withdrawals"
  ON public.withdrawal_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawal_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
