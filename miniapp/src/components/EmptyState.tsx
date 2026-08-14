import type { ReactNode } from "react";
import { Button } from "./Button";

interface Props {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, text, actionLabel, onAction, icon }: Props) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      <h3 className="h3">{title}</h3>
      <p className="small">{text}</p>
      {actionLabel && onAction ? (
        <div style={{ marginTop: 16 }}>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
