# Orders Schema Update

## Issue Identified

During a review of the orders section in the admin interface, a discrepancy was discovered between the database schema and the frontend code. The `CreateOrderModal` component was using fields like `pharmacy_id` and `linked_session_id` that were not defined in the orders table schema in the migrations.

## Analysis

The following components were using fields that were not present in the database schema:

1. `CreateOrderModal.jsx` - Using `pharmacy_id` and `linked_session_id`
2. `Orders.js` - Using `pharmacy_id` and `linked_session_id` for creating orders
3. `OrderDetailModal.jsx` - Displaying pharmacy information and tracking details

The original orders table schema (from `20250414184000_create_orders_tables.sql`) did not include these columns:

```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping_address JSONB,
  billing_address JSONB,
  invoice_id UUID REFERENCES public.pb_invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

## Solution

A new migration file (`20250507000000_add_missing_columns_to_orders.sql`) was created to add the missing columns to the orders table:

```sql
-- Add pharmacy_id column with foreign key reference to pharmacies table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE SET NULL;

-- Add linked_session_id column with foreign key reference to sessions table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS linked_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;

-- Add hold_reason column for pending orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS hold_reason TEXT;

-- Add tracking_number column for shipped orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add estimated_delivery column for shipped orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;
```

Additionally, indexes were added for the new columns to improve query performance:

```sql
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_id ON public.orders (pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_linked_session_id ON public.orders (linked_session_id);
```

## Benefits

This update ensures that:

1. The database schema matches what the frontend code is expecting
2. The `CreateOrderModal` can properly store pharmacy and session information
3. The `OrderDetailModal` can display complete order information
4. The Orders page can filter and display orders with their related pharmacy and session information

## Next Steps

1. Run the migration to apply these changes to the database
2. Test the order creation and viewing functionality to ensure it works correctly
3. Consider adding validation to ensure that pharmacy_id is required when creating an order
