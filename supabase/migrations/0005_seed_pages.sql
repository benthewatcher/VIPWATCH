-- Seed singleton pages used by the public site.

insert into pages (key, hero_heading_en, hero_heading_fr, hero_cta_label_en, hero_cta_label_fr, hero_cta_href, body_en, body_fr, meta_title_en, meta_title_fr, meta_description_en, meta_description_fr) values
('home',
 'An atelier for the singular collector',
 'Un atelier pour le collectionneur singulier',
 'Begin a commission',
 'Commencer une réalisation',
 '/contact',
 'We modify the watch you already own — engraved, skeletonised, gem-set, finished — to a brief that is yours alone.',
 'Nous modifions la montre que vous possédez déjà — gravée, squelettisée, sertie, finie — selon un cahier des charges qui n''appartient qu''à vous.',
 'VIP WATCH — Bespoke watchmaking atelier',
 'VIP WATCH — Atelier de personnalisation horlogère',
 'Bespoke personalisation and restoration of luxury timepieces. Geneva.',
 'Personnalisation et restauration sur mesure de garde-temps de luxe. Genève.'),
('atelier', 'The Atelier', 'L''Atelier', null, null, null, null, null, null, null, null, null),
('warranty', 'International Warranty', 'Garantie Internationale', null, null, null, null, null, null, null, null, null),
('arts-and-crafts', 'Arts & Crafts', 'Arts & Métiers', null, null, null, null, null, null, null, null, null),
('process-intro', 'Process', 'Processus', null, null, null, null, null, null, null, null, null)
on conflict (key) do update set
  hero_heading_en = excluded.hero_heading_en,
  hero_heading_fr = excluded.hero_heading_fr,
  hero_cta_label_en = excluded.hero_cta_label_en,
  hero_cta_label_fr = excluded.hero_cta_label_fr,
  hero_cta_href = excluded.hero_cta_href,
  body_en = excluded.body_en,
  body_fr = excluded.body_fr,
  meta_title_en = excluded.meta_title_en,
  meta_title_fr = excluded.meta_title_fr,
  meta_description_en = excluded.meta_description_en,
  meta_description_fr = excluded.meta_description_fr;
