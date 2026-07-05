export interface Profile {
  id: string;
  has_paid: boolean;
  stripe_customer_id: string | null;
  stripe_payment_id: string | null;
  paid_at: string | null;
  is_admin: boolean;
}

export interface ContentSection {
  id: string;
  slug: string;
  title: string;
  teaser: string;
  body: string;
  sort_order: number;
  is_free_preview: boolean;
  file_key: string | null;
  file_name: string | null;
  image_key: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteContent {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Download {
  id: string;
  label: string;
  file_key: string;
  file_name: string;
  sort_order: number;
  created_at: string;
}
