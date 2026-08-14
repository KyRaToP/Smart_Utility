interface Props {
  title: string;
  onBack: () => void;
}

export function BackRow({ title, onBack }: Props) {
  return (
    <div className="back-row">
      <button type="button" onClick={onBack}>
        Назад
      </button>
      <h1 className="h3">{title}</h1>
    </div>
  );
}
