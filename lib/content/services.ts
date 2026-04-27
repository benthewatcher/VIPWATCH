export type ServiceContent = {
  slug: string;
  number: string;
  icon: string;
  title: { en: string; fr: string };
  summary: { en: string; fr: string };
  body: { en: string; fr: string };
};

export const SERVICES: ServiceContent[] = [
  {
    slug: 'design',
    number: '01',
    icon: 'PenTool',
    title: { en: 'Design', fr: 'Conception' },
    summary: {
      en: 'Translating a brief into a precise blueprint.',
      fr: 'Traduire un brief en plan précis.',
    },
    body: {
      en: 'Every commission opens with the design department. Hand sketches, CAD renders, and material swatches are produced until the brief is locked. We do not begin work on the watch until you have approved the file.',
      fr: 'Chaque réalisation commence au département conception. Croquis manuels, rendus CAO et échantillons matières sont produits jusqu\'à validation du dossier. Aucun travail ne débute avant votre accord écrit.',
    },
  },
  {
    slug: 'engraving',
    number: '02',
    icon: 'Sparkles',
    title: { en: 'Hand Engraving', fr: 'Gravure à la main' },
    summary: {
      en: 'Bezels, case-bands, lugs, dial details — engraved by hand.',
      fr: 'Lunettes, carrures, cornes, détails de cadran — gravés à la main.',
    },
    body: {
      en: 'We do not subcontract engraving. A single master engraver carries each piece from rough cut to final finish. Lettering, scrolls, full Damascene grounds and bas-relief portraiture are all part of the repertoire.',
      fr: 'La gravure n\'est jamais sous-traitée. Un seul maître graveur accompagne chaque pièce du dégrossi à la finition. Lettrage, volutes, fonds damasquinés et bas-reliefs font partie du répertoire.',
    },
  },
  {
    slug: 'skeletonisation',
    number: '03',
    icon: 'Layers',
    title: { en: 'Skeletonisation', fr: 'Squelettage' },
    summary: {
      en: 'Reducing a movement to its essential structure.',
      fr: 'Réduire un mouvement à sa structure essentielle.',
    },
    body: {
      en: 'Working from the original calibre we remove material along strict load paths, refinish bridges and plates, then anglage every visible edge. The watch keeps factory accuracy after our intervention or it does not leave the atelier.',
      fr: 'À partir du calibre d\'origine, nous retirons matière selon des trajectoires de charge strictes, refinissons ponts et platines, puis anglons chaque arête visible. La précision d\'origine est conservée — sans cela, la pièce ne sort pas de l\'atelier.',
    },
  },
  {
    slug: 'gem-setting',
    number: '04',
    icon: 'Gem',
    title: { en: 'Gem-setting', fr: 'Sertissage' },
    summary: {
      en: 'Snow, baguette, pavé, invisible — set in-house.',
      fr: 'Neige, baguette, pavé, invisible — sertis en interne.',
    },
    body: {
      en: 'Stones are sourced from a small group of suppliers we trust on origin and certification. Setting is performed under microscope on the watch itself, never on a replacement part.',
      fr: 'Les pierres proviennent d\'un cercle restreint de fournisseurs de confiance, sur origine et certification. Le sertissage s\'effectue sous binoculaire sur la pièce elle-même, jamais sur un composant de remplacement.',
    },
  },
  {
    slug: 'dial-making',
    number: '05',
    icon: 'CircleDot',
    title: { en: 'Dial Making', fr: 'Cadran' },
    summary: {
      en: 'New dials in enamel, lacquer, meteorite, hand-guilloché.',
      fr: 'Cadrans neufs en émail, laque, météorite, guilloché main.',
    },
    body: {
      en: 'We replace the dial only when the brief calls for it. Grand feu enamel, fired in our own kilns, is our signature; we also work in stone, mother-of-pearl, and full-aventurine.',
      fr: 'Nous ne remplaçons le cadran que si le brief l\'exige. L\'émail grand feu, cuit dans nos propres fours, est notre signature ; nous travaillons aussi pierres, nacre et aventurine.',
    },
  },
  {
    slug: 'finishing',
    number: '06',
    icon: 'Hand',
    title: { en: 'Finishing', fr: 'Finition' },
    summary: {
      en: 'Côtes de Genève, perlage, anglage, black polish.',
      fr: 'Côtes de Genève, perlage, anglage, poli noir.',
    },
    body: {
      en: 'Surface treatments are the quiet luxury of horology. Every visible surface — and many invisible ones — is finished by hand to a tolerance most owners never see and yet always feel.',
      fr: 'Les traitements de surface sont le luxe discret de l\'horlogerie. Chaque surface visible — et beaucoup d\'invisibles — est finie main à une tolérance que peu remarquent mais que tous ressentent.',
    },
  },
  {
    slug: 'restoration',
    number: '07',
    icon: 'Wrench',
    title: { en: 'Restoration', fr: 'Restauration' },
    summary: {
      en: 'Returning a vintage piece to running order, with respect.',
      fr: 'Remettre une pièce ancienne en marche, avec respect.',
    },
    body: {
      en: 'Where commissions add, restoration preserves. We re-create lost components from period drawings, refinish without erasing the watchmaker\'s original tool marks, and document every intervention.',
      fr: 'Là où la réalisation ajoute, la restauration préserve. Nous reproduisons les composants manquants d\'après plans d\'époque, refinissons sans effacer les marques d\'outil d\'origine, et documentons chaque intervention.',
    },
  },
];

export const PROCESS_STEPS: { number: string; title: { en: string; fr: string }; copy: { en: string; fr: string } }[] = [
  {
    number: '01',
    title: { en: 'Enquiry', fr: 'Demande' },
    copy: {
      en: 'You write to us with the watch you own and the brief in mind. We reply within two working days with an initial conversation.',
      fr: 'Vous nous écrivez avec la montre concernée et le brief en tête. Nous répondons sous deux jours ouvrés pour un premier échange.',
    },
  },
  {
    number: '02',
    title: { en: 'Consultation', fr: 'Consultation' },
    copy: {
      en: 'A confidential meeting — in Geneva, online, or with our travelling watchmaker — to translate the brief into specifications and confirm feasibility.',
      fr: 'Un entretien confidentiel — à Genève, en visioconférence, ou avec notre horloger itinérant — pour traduire le brief en cahier des charges et valider la faisabilité.',
    },
  },
  {
    number: '03',
    title: { en: 'Design', fr: 'Conception' },
    copy: {
      en: 'Sketches, CAD renders, finish samples and material swatches. The file is iterated until you sign off in writing.',
      fr: 'Croquis, rendus CAO, échantillons de finitions et matières. Le dossier est itéré jusqu\'à votre validation écrite.',
    },
  },
  {
    number: '04',
    title: { en: 'Quotation', fr: 'Devis' },
    copy: {
      en: 'A fixed-price quotation by department, with a delivery window. A 50% deposit confirms the commission.',
      fr: 'Un devis ferme par département, avec fenêtre de livraison. Un acompte de 50 % confirme la commande.',
    },
  },
  {
    number: '05',
    title: { en: 'Commission', fr: 'Réalisation' },
    copy: {
      en: 'Your watch arrives at the atelier under insured transport. Work proceeds department by department; you receive monthly photographic reports.',
      fr: 'Votre montre arrive à l\'atelier sous transport assuré. Le travail progresse département par département ; vous recevez un reporting photographique mensuel.',
    },
  },
  {
    number: '06',
    title: { en: 'Delivery', fr: 'Livraison' },
    copy: {
      en: 'Hand-delivered when geography allows, or insured-shipped with full provenance file, certificate, and our international warranty.',
      fr: 'Remise en main propre quand la géographie le permet, sinon livraison assurée avec dossier de provenance complet, certificat et notre garantie internationale.',
    },
  },
];
