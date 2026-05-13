import Script from 'next/script';

/**
 * Google Analytics 4 — fires on every page.
 * Renders nothing if NEXT_PUBLIC_GA_ID is unset, so local dev stays clean.
 *
 * Note: this runs even with the current sitewide `noindex` — analytics tracks
 * real visitors, not search crawlers. When you flip noindex off for launch the
 * data is already wired up.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
