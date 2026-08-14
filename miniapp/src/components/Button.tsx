import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  children: ReactNode;
}

export function Button({ variant = "primary", children, className = "", ...props }: Props) {
  return (
    <button className={`btn btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
