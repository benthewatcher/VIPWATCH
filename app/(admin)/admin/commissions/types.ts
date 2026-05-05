// Shared types for commission blocks. Lives outside actions.ts because
// 'use server' files can only export async functions in Next 15.

export type CommissionBlockType = 'paragraph' | 'image' | 'image_pair';

export type CommissionBlockRow = {
  id: string;
  position: number;
  type: CommissionBlockType;
  hidden: boolean;
  body_en: string | null;
  body_fr: string | null;
  image_url: string | null;
  image_url_2: string | null;
  alt_en: string | null;
  alt_fr: string | null;
};
