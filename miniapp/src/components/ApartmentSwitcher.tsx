import type { Apartment } from "../types";

interface Props {
  apartments: Apartment[];
  activeId: string | null;
  onChange: (id: string) => void;
  onDark?: boolean;
}

export function ApartmentSwitcher({ apartments, activeId, onChange, onDark = false }: Props) {
  if (apartments.length === 0) {
    return null;
  }

  return (
    <div
      className={`apartment-switcher${onDark ? " apartment-switcher--on-dark" : ""}`}
      role="tablist"
      aria-label="Квартиры"
    >
      {apartments.map((apartment) => (
        <button
          key={apartment.id}
          type="button"
          className={`chip${apartment.id === activeId ? " is-active" : ""}`}
          onClick={() => onChange(apartment.id)}
        >
          {apartment.name}
        </button>
      ))}
    </div>
  );
}
