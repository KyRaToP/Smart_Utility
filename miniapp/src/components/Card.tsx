import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  size?: "sm" | "md" | "hero";
  className?: string;
}

export function Card({ children, size = "md", className = "" }: Props) {
  const sizeClass = size === "hero" ? "card--hero" : size === "sm" ? "card--sm" : "";
  return <section className={`card ${sizeClass} ${className}`.trim()}>{children}</section>;
}
