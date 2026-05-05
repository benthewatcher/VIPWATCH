'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

type State = { ok: boolean; error?: string; ts?: number };

async function wrapAction(
  action: (form: FormData) => Promise<void>,
  _prev: State,
  form: FormData,
): Promise<State> {
  try {
    await action(form);
    return { ok: true, ts: Date.now() };
  } catch (e) {
    return { ok: false, error: (e as Error).message, ts: Date.now() };
  }
}

export function HomeBlockForm({
  action,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useActionState(wrapAction.bind(null, action), { ok: false });
  const [showSaved, setShowSaved] = useState(false);
  const lastTs = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.ok && state.ts && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state.ok, state.ts]);

  return (
    <form action={dispatch} className="grid gap-6">
      {children}
      <div className="pt-4 border-t border-divider flex items-center gap-4">
        <SaveButton />
        {showSaved && (
          <span className="text-xs uppercase tracking-[0.2em] text-accent">Saved ✓</span>
        )}
        {state.ok === false && state.error && (
          <span className="text-xs text-red-400">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save block'}
    </button>
  );
}
