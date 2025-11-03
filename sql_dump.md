# BulkFlow TMS SQL Dump

This file defines the PostgreSQL schema for BulkFlow TMS, designed for Supabase integration.

```sql
-- Table: companies
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('shipper', 'carrier', 'internal')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('executive', 'admin', 'billing', 'csr', 'dispatch', 'customer', 'carrier', 'driver')),
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: loads
CREATE TABLE public.loads (
    id BIGSERIAL PRIMARY KEY,
    load_number TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending_pickup','in_transit','delivered','delayed','closed')),
    dispatcher_id UUID REFERENCES public.users(id),
    customer_id UUID REFERENCES public.companies(id),
    carrier_id UUID REFERENCES public.companies(id),
    driver_id UUID REFERENCES public.users(id),
    commodity TEXT,
    equipment_type TEXT,
    pricing_type TEXT CHECK (pricing_type IN ('flat','per_ton')),
    customer_rate NUMERIC(10,2),
    carrier_rate NUMERIC(10,2),
    margin_percent NUMERIC(5,2) GENERATED ALWAYS AS 
       (CASE WHEN customer_rate > 0 THEN ((customer_rate - carrier_rate) / customer_rate) * 100 ELSE NULL END) STORED,
    pickup_location TEXT,
    delivery_location TEXT,
    pickup_time TIMESTAMPTZ,
    delivery_time TIMESTAMPTZ,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bids
CREATE TABLE public.bids (
    id BIGSERIAL PRIMARY KEY,
    load_id BIGINT REFERENCES public.loads(id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES public.companies(id),
    bid_amount NUMERIC(10,2) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('pending','accepted','rejected')) DEFAULT 'pending'
);

-- Table: status_history
CREATE TABLE public.status_history (
    id BIGSERIAL PRIMARY KEY,
    load_id BIGINT REFERENCES public.loads(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Table: documents
CREATE TABLE public.documents (
    id BIGSERIAL PRIMARY KEY,
    load_id BIGINT REFERENCES public.loads(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('POD','BOL','Invoice')),
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: invoices
CREATE TABLE public.invoices (
    id BIGSERIAL PRIMARY KEY,
    load_id BIGINT REFERENCES public.loads(id) UNIQUE,
    customer_id UUID REFERENCES public.companies(id),
    amount NUMERIC(10,2) NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('issued','paid','overdue')) DEFAULT 'issued'
);
```
