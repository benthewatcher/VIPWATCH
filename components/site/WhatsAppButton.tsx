'use client';

const PREFILL: Record<string, string> = {
  en: 'Hello — I have a watch in mind.',
  ar: "Bonjour — j'ai une idée de projet.",
};

export function WhatsAppButton({ locale }: { locale: string }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;

  const text = PREFILL[locale] ?? PREFILL.en;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid place-items-center w-14 h-14 rounded-full bg-[#25d366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:scale-105 transition-transform"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        width="26"
        height="26"
        aria-hidden
      >
        <path d="M20.52 3.48A11.78 11.78 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.86 11.86 0 0 0 5.79 1.48h.01c6.57 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.47-8.44Zm-8.45 18.34h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.98 1-3.62-.23-.37a9.83 9.83 0 0 1-1.52-5.3c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.98 2.9a9.81 9.81 0 0 1 2.9 6.99c0 5.46-4.44 9.9-9.91 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.19-.24-.58-.49-.5-.66-.51l-.56-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.34Z" />
      </svg>
    </a>
  );
}
