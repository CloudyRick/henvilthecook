-- Testimonials table (screenshot images)
CREATE TABLE testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view testimonials
CREATE POLICY "Anyone can read testimonials"
  ON testimonials FOR SELECT
  USING (TRUE);

CREATE INDEX idx_testimonials_sort ON testimonials(sort_order);

-- Create storage bucket for testimonial screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonials', 'testimonials', true);

-- Allow public read access to testimonial images
CREATE POLICY "Public read access for testimonials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonials');

-- Allow authenticated uploads (admin check happens in server action)
CREATE POLICY "Authenticated users can upload testimonials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'testimonials' AND auth.role() = 'authenticated');

-- Allow authenticated deletes
CREATE POLICY "Authenticated users can delete testimonials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'testimonials' AND auth.role() = 'authenticated');
