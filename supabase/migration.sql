-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_paid BOOLEAN DEFAULT FALSE NOT NULL,
  stripe_customer_id TEXT,
  stripe_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Content sections (chapters/sections of the guide)
CREATE TABLE content_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Site-wide settings (hero title, subtitle, price display, etc.)
CREATE TABLE site_content (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Purchase audit log
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Profiles: users read own, service role writes
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Content sections: anyone can read all (content gated in UI)
CREATE POLICY "Anyone can read all sections"
  ON content_sections FOR SELECT
  USING (TRUE);

-- Site content: anyone can read
CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT
  USING (TRUE);

-- Purchases: users read own
CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Seed initial site content
INSERT INTO site_content (key, value) VALUES
  ('hero_title', 'The Australian Chef Guide'),
  ('hero_subtitle', 'A Chefs Journey in Australia'),
  ('hero_description', 'A practical guide for chefs who want to work in Australia. Learn your visa options, where to apply jobs, how sponsorship works, what chefs can earn, and how to avoid costly mistakes before spending money on agencies or schools.'),
  ('price_display', '$19 AUD'),
  ('cta_text', 'Get Full Access');

-- Seed sample content sections
INSERT INTO content_sections (slug, title, body, sort_order, is_free_preview) VALUES
  ('my-journey', 'My Journey', 'Welcome to my journey. This guide covers everything I learned navigating the Australian immigration system as a chef...', 1, TRUE),
  ('salary-and-hours', 'What chefs actually earn across Australia', 'When I first arrived in Australia, I had no idea what to expect...', 2, TRUE),
  ('visa-options', 'Understanding Visa Options for Chefs', 'The Australian visa system can be overwhelming. Here are the key pathways...', 3, FALSE),
  ('employer-sponsorship', 'Finding an Employer Sponsor', 'One of the most critical steps is finding an employer willing to sponsor you...', 4, FALSE),
  ('skills-assessment', 'Skills Assessment Process', 'Before applying for a skilled visa, you need to get your qualifications assessed...', 5, FALSE),
  ('pr-application', 'The PR Application Journey', 'After years of preparation, I finally submitted my permanent residency application...', 6, FALSE),
  ('tips-and-advice', 'Tips & Advice', 'Here are my top recommendations for anyone following a similar path...', 7, FALSE);

-- Indexes
-- Run this if adding teaser to an existing DB: ALTER TABLE content_sections ADD COLUMN IF NOT EXISTS teaser TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_content_sections_sort ON content_sections(sort_order);
CREATE INDEX idx_content_sections_preview ON content_sections(is_free_preview);
CREATE INDEX idx_purchases_user ON purchases(user_id);


-- Making user as admin 
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-uid-here';
ALTER TABLE content_sections ADD COLUMN IF NOT EXISTS teaser TEXT NOT NULL DEFAULT '';