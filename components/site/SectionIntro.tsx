import { FadeUp } from './FadeUp';
import { Link } from '@/lib/i18n/routing';

export function SectionIntro({
  eyebrow,
  heading,
  copy,
  cta,
  align = 'left',
}: {
  eyebrow?: string;
  heading: string;
  copy?: string;
  cta?: { label: string; href: string };
  align?: 'left' | 'center';
}) {
  return (
    <FadeUp className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
      )}
      <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mt-4 leading-[1.1] tracking-tight">
        {heading}
      </h2>
      {copy && <p className="mt-6 text-lg text-text-muted">{copy}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="inline-block mt-8 text-xs uppercase tracking-[0.25em] text-accent border-b border-accent pb-1 hover:text-accent-hover hover:border-accent-hover"
        >
          {cta.label}
        </Link>
      )}
    </FadeUp>
  );
}
