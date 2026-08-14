interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  placeholder,
  inputMode,
}: Props) {
  return (
    <label className="field">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
