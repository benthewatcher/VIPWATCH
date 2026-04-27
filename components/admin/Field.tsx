export function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  textarea,
  rows = 4,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) {
  const value = defaultValue ?? '';
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          rows={rows}
          required={required}
          defaultValue={value as string}
          placeholder={placeholder}
          className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={value as string}
          placeholder={placeholder}
          className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      )}
    </label>
  );
}

export function BilingualField({
  label,
  field,
  row,
  textarea,
  rows = 4,
  required,
}: {
  label: string;
  field: string; // base name e.g. "title"
  row?: Record<string, unknown> | null;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
}) {
  const en = (row?.[`${field}_en`] as string | null) ?? '';
  const fr = (row?.[`${field}_fr`] as string | null) ?? '';
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <Field label="EN" name={`${field}_en`} defaultValue={en} textarea={textarea} rows={rows} required={required} />
        <Field label="FR" name={`${field}_fr`} defaultValue={fr} textarea={textarea} rows={rows} required={required} />
      </div>
    </div>
  );
}
