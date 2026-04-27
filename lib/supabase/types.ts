// Hand-rolled until you run:
//   npx supabase gen types typescript --project-id edpidhthaunlmuktlkxl > lib/supabase/types.ts
//
// Mirrors supabase/migrations/0001_init.sql. Keep in sync until autogen replaces it.

export type PublishStatus = 'draft' | 'published' | 'archived';
export type EnquiryStatus = 'new' | 'in_progress' | 'qualified' | 'won' | 'lost' | 'spam';
export type AdminRole = 'owner' | 'editor';
export type LocaleCode = 'fr' | 'en';

type Bilingual<K extends string, T = string | null> = {
  [P in `${K}_en` | `${K}_fr`]: T;
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandRow = {
  id: string;
  slug: string;
  name: string;
  position: number;
  created_at: string;
};

export type CommissionRow = {
  id: string;
  slug: string;
  client_initials: string | null;
  brand_id: string | null;
  watch_model: string | null;
  year_started: number | null;
  hero_image: string | null;
  hero_video: string | null;
  card_image: string | null;
  status: PublishStatus;
  is_featured: boolean;
  position: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
} & Bilingual<'title', string> &
  Bilingual<'summary'> &
  Bilingual<'body'>;

export type CommissionImageRow = {
  id: string;
  commission_id: string;
  url: string;
  position: number;
  created_at: string;
} & Bilingual<'alt'>;

export type ProcessStepRow = {
  id: string;
  number: string;
  position: number;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
} & Bilingual<'title', string> &
  Bilingual<'copy', string>;

export type ServiceRow = {
  id: string;
  slug: string;
  icon_name: string | null;
  hero_image: string | null;
  position: number;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
} & Bilingual<'title', string> &
  Bilingual<'summary'> &
  Bilingual<'body'>;

export type TestimonialRow = {
  id: string;
  client_name: string;
  client_role: string | null;
  photo_url: string | null;
  position: number;
  is_featured: boolean;
  created_at: string;
} & Bilingual<'quote', string>;

export type FaqRow = {
  id: string;
  category: string | null;
  position: number;
  status: PublishStatus;
  created_at: string;
} & Bilingual<'question', string> &
  Bilingual<'answer', string>;

export type BlogCategoryRow = {
  id: string;
  slug: string;
  position: number;
} & Bilingual<'name', string>;

export type BlogPostRow = {
  id: string;
  slug: string;
  hero_image: string | null;
  author_id: string | null;
  status: PublishStatus;
  published_at: string | null;
  reading_minutes: number | null;
  created_at: string;
  updated_at: string;
} & Bilingual<'title', string> &
  Bilingual<'excerpt'> &
  Bilingual<'body'>;

export type PageRow = {
  key: string;
  hero_image: string | null;
  hero_video: string | null;
  hero_cta_href: string | null;
  updated_at: string;
} & Partial<Bilingual<'title'>> &
  Partial<Bilingual<'hero_heading'>> &
  Partial<Bilingual<'hero_cta_label'>> &
  Partial<Bilingual<'body'>> &
  Partial<Bilingual<'meta_title'>> &
  Partial<Bilingual<'meta_description'>>;

export type LegalPageRow = {
  slug: string;
  updated_at: string;
} & Bilingual<'title', string> &
  Bilingual<'body', string>;

export type EnquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  watch_brand: string | null;
  watch_model: string | null;
  watch_reference: string | null;
  message: string;
  budget_band: string | null;
  preferred_contact: string | null;
  source_locale: LocaleCode;
  source_path: string | null;
  source_referrer: string | null;
  status: EnquiryStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  locale: LocaleCode;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  resend_contact_id: string | null;
};

export type SettingsRow = {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
};

type WriteOf<T, RequiredKeys extends keyof T = never> = {
  [K in RequiredKeys]: T[K];
} & Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

type Table<R, IRequired extends keyof R = never> = {
  Row: R;
  Insert: WriteOf<R, IRequired>;
  Update: Partial<R>;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '12' };
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'id' | 'email'>;
      brands: Table<BrandRow, 'slug' | 'name'>;
      commissions: Table<CommissionRow, 'slug' | 'title_en' | 'title_fr'>;
      commission_images: Table<CommissionImageRow, 'commission_id' | 'url'>;
      services: Table<ServiceRow, 'slug' | 'title_en' | 'title_fr'>;
      process_steps: Table<ProcessStepRow, 'number' | 'title_en' | 'title_fr' | 'copy_en' | 'copy_fr'>;
      testimonials: Table<TestimonialRow, 'client_name' | 'quote_en' | 'quote_fr'>;
      faqs: Table<FaqRow, 'question_en' | 'question_fr' | 'answer_en' | 'answer_fr'>;
      blog_categories: Table<BlogCategoryRow, 'slug' | 'name_en' | 'name_fr'>;
      blog_posts: Table<BlogPostRow, 'slug' | 'title_en' | 'title_fr'>;
      blog_post_categories: Table<{ blog_post_id: string; category_id: string }, 'blog_post_id' | 'category_id'>;
      pages: Table<PageRow, 'key'>;
      legal_pages: Table<LegalPageRow, 'slug' | 'title_en' | 'title_fr' | 'body_en' | 'body_fr'>;
      enquiries: Table<EnquiryRow, 'name' | 'email' | 'message'>;
      newsletter_subscribers: Table<NewsletterSubscriberRow, 'email'>;
      settings: Table<SettingsRow, 'key' | 'value'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      publish_status: PublishStatus;
      enquiry_status: EnquiryStatus;
      admin_role: AdminRole;
      locale_code: LocaleCode;
    };
  };
};
