interface Props {
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  children: string;
}

export function Badge({ tone = "neutral", children }: Props) {
  return (
    <span className={`badge badge--${tone}`}>
      {tone !== "neutral" && tone !== "info" ? <span className="badge__dot" /> : null}
      {children}
    </span>
  );
}
