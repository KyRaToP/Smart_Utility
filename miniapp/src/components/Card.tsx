import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  size?: "sm" | "md" | "hero";
  className?: string;
  onClick?: () => void;
}

export function Card({ children, size = "md", className = "", onClick }: Props) {
  const sizeClass = size === "hero" ? "card--hero" : size === "sm" ? "card--sm" : "";
  const classNameFull = `card ${sizeClass} ${className}`.trim();
  if (onClick) {
    return (
      <button type="button" className={`${classNameFull} card--button`} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <section className={classNameFull}>{children}</section>;
}
