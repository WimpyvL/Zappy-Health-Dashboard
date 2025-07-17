-- Migration to create the foundational tables for the full telehealth flow.
-- This integrates categories, products, subscriptions, and flow tracking.

BEGIN;

-- 1. Create category_form_templates table
-- Links categories to specific form templates for dynamic form generation
CREATE TABLE IF NOT EXISTS public.category_form_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    form_template_id uuid NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    priority integer NOT NULL DEFAULT 0,
    conditions jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT category_form_templates_pkey PRIMARY KEY (id),
    CONSTRAINT category_form_templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    CONSTRAINT category_form_templates_form_template_id_fkey FOREIGN KEY (form_template_id) REFERENCES public.questionnaire(id) ON DELETE CASCADE,
    CONSTRAINT category_form_templates_category_id_form_template_id_key UNIQUE (category_id, form_template_id)
);
ALTER TABLE public.category_form_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON public.category_form_templates FOR SELECT USING (true);
CREATE POLICY "Allow admin access to modify" ON public.category_form_templates FOR ALL USING (auth.role() = 'service_role');


-- 2. Create product_subscription_mappings table
-- Defines which subscription durations are available for each product and their pricing
CREATE TABLE IF NOT EXISTS public.product_subscription_mappings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL,
    subscription_duration_id uuid NOT NULL,
    discounted_price numeric(10,2),
    original_price numeric(10,2),
    discount_percentage numeric(5,2),
    is_default boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT product_subscription_mappings_pkey PRIMARY KEY (id),
    CONSTRAINT product_subscription_mappings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT product_subscription_mappings_subscription_duration_id_fkey FOREIGN KEY (subscription_duration_id) REFERENCES public.subscription_durations(id) ON DELETE CASCADE,
    CONSTRAINT product_subscription_mappings_product_id_subscription_durati_key UNIQUE (product_id, subscription_duration_id)
);
ALTER TABLE public.product_subscription_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON public.product_subscription_mappings FOR SELECT USING (true);
CREATE POLICY "Allow admin access to modify" ON public.product_subscription_mappings FOR ALL USING (auth.role() = 'service_role');


-- 3. Create enhanced_telehealth_flows table
-- Central tracking table for the complete patient journey
CREATE TABLE IF NOT EXISTS public.enhanced_telehealth_flows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid,
    category_id uuid,
    product_id uuid,
    subscription_duration_id uuid,
    current_status text NOT NULL,
    form_submission_id uuid,
    order_id uuid,
    consultation_id uuid,
    invoice_id uuid,
    subscription_id uuid,
    pricing_snapshot jsonb,
    flow_metadata jsonb,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT enhanced_telehealth_flows_pkey PRIMARY KEY (id),
    CONSTRAINT enhanced_telehealth_flows_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_form_submission_id_fkey FOREIGN KEY (form_submission_id) REFERENCES public.form_submissions(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.pb_invoices(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_subscription_duration_id_fkey FOREIGN KEY (subscription_duration_id) REFERENCES public.subscription_durations(id) ON DELETE SET NULL,
    CONSTRAINT enhanced_telehealth_flows_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL
);
ALTER TABLE public.enhanced_telehealth_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own flows" ON public.enhanced_telehealth_flows FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Allow admins to manage all flows" ON public.enhanced_telehealth_flows FOR ALL USING (auth.role() = 'service_role');


-- 4. Create flow_recommendations table
-- Tracks product recommendations with acceptance tracking
CREATE TABLE IF NOT EXISTS public.flow_recommendations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    flow_id uuid NOT NULL,
    recommended_product_id uuid NOT NULL,
    recommendation_reason text,
    recommendation_type text,
    confidence_score numeric(3,2),
    accepted boolean,
    viewed boolean,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT flow_recommendations_pkey PRIMARY KEY (id),
    CONSTRAINT flow_recommendations_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.enhanced_telehealth_flows(id) ON DELETE CASCADE,
    CONSTRAINT flow_recommendations_recommended_product_id_fkey FOREIGN KEY (recommended_product_id) REFERENCES public.products(id) ON DELETE CASCADE
);
ALTER TABLE public.flow_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their recommendations" ON public.flow_recommendations FOR SELECT USING (EXISTS (SELECT 1 FROM enhanced_telehealth_flows WHERE id = flow_id AND auth.uid() = patient_id));
CREATE POLICY "Allow admins to manage all recommendations" ON public.flow_recommendations FOR ALL USING (auth.role() = 'service_role');


-- 5. Create category_pricing_rules table
-- Defines category-specific pricing rules and discount structures
CREATE TABLE IF NOT EXISTS public.category_pricing_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    rule_type text NOT NULL,
    rule_value numeric(10,2),
    rule_percentage numeric(5,2),
    conditions jsonb,
    is_active boolean NOT NULL DEFAULT true,
    priority integer DEFAULT 0,
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT category_pricing_rules_pkey PRIMARY KEY (id),
    CONSTRAINT category_pricing_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);
ALTER TABLE public.category_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON public.category_pricing_rules FOR SELECT USING (true);
CREATE POLICY "Allow admin access to modify" ON public.category_pricing_rules FOR ALL USING (auth.role() = 'service_role');


-- 6. Create flow_state_transitions table
-- Audit trail of all status changes in the telehealth flow
CREATE TABLE IF NOT EXISTS public.flow_state_transitions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    flow_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    transition_reason text,
    transition_data jsonb,
    triggered_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT flow_state_transitions_pkey PRIMARY KEY (id),
    CONSTRAINT flow_state_transitions_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.enhanced_telehealth_flows(id) ON DELETE CASCADE,
    CONSTRAINT flow_state_transitions_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.flow_state_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admins to view all transitions" ON public.flow_state_transitions FOR SELECT USING (auth.role() = 'service_role');


-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
CREATE TRIGGER handle_updated_at_category_form_templates BEFORE UPDATE ON public.category_form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_updated_at_product_subscription_mappings BEFORE UPDATE ON public.product_subscription_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_updated_at_enhanced_telehealth_flows BEFORE UPDATE ON public.enhanced_telehealth_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_updated_at_category_pricing_rules BEFORE UPDATE ON public.category_pricing_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_form_templates_category_id ON public.category_form_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_product_subscription_mappings_product_id ON public.product_subscription_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_telehealth_flows_patient_id ON public.enhanced_telehealth_flows(patient_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_telehealth_flows_status ON public.enhanced_telehealth_flows(current_status);
CREATE INDEX IF NOT EXISTS idx_flow_recommendations_flow_id ON public.flow_recommendations(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_state_transitions_flow_id ON public.flow_state_transitions(flow_id);

COMMIT;
