-- Process steps table — small, ordered, bilingual.

create table if not exists process_steps (
  id uuid primary key default gen_random_uuid(),
  number text not null,                 -- '01', '02', etc — display string
  position int not null default 0,
  status publish_status not null default 'published',
  title_en text not null,
  title_fr text not null,
  copy_en text not null,
  copy_fr text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists process_steps_position_idx on process_steps(position);

drop trigger if exists trg_process_steps_updated_at on process_steps;
create trigger trg_process_steps_updated_at before update on process_steps
  for each row execute function set_updated_at();

alter table process_steps enable row level security;

drop policy if exists "public read process steps" on process_steps;
create policy "public read process steps" on process_steps
  for select using (status = 'published');

drop policy if exists "admin all on process_steps" on process_steps;
create policy "admin all on process_steps" on process_steps
  for all using (is_admin()) with check (is_admin());

-- seed
insert into process_steps (number, position, title_en, title_fr, copy_en, copy_fr) values
('01', 1, 'Enquiry', 'Demande',
 'You write to us with the watch you own and the brief in mind. We reply within two working days with an initial conversation.',
 'Vous nous écrivez avec la montre concernée et le brief en tête. Nous répondons sous deux jours ouvrés pour un premier échange.'),
('02', 2, 'Consultation', 'Consultation',
 'A confidential meeting — in Geneva, online, or with our travelling watchmaker — to translate the brief into specifications and confirm feasibility.',
 'Un entretien confidentiel — à Genève, en visioconférence, ou avec notre horloger itinérant — pour traduire le brief en cahier des charges et valider la faisabilité.'),
('03', 3, 'Design', 'Conception',
 'Sketches, CAD renders, finish samples and material swatches. The file is iterated until you sign off in writing.',
 'Croquis, rendus CAO, échantillons de finitions et matières. Le dossier est itéré jusqu''à votre validation écrite.'),
('04', 4, 'Quotation', 'Devis',
 'A fixed-price quotation by department, with a delivery window. A 50% deposit confirms the commission.',
 'Un devis ferme par département, avec fenêtre de livraison. Un acompte de 50 % confirme la commande.'),
('05', 5, 'Commission', 'Réalisation',
 'Your watch arrives at the atelier under insured transport. Work proceeds department by department; you receive monthly photographic reports.',
 'Votre montre arrive à l''atelier sous transport assuré. Le travail progresse département par département ; vous recevez un reporting photographique mensuel.'),
('06', 6, 'Delivery', 'Livraison',
 'Hand-delivered when geography allows, or insured-shipped with full provenance file, certificate, and our international warranty.',
 'Remise en main propre quand la géographie le permet, sinon livraison assurée avec dossier de provenance complet, certificat et notre garantie internationale.')
on conflict do nothing;
