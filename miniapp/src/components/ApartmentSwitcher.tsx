import type { Apartment } from "../types";

interface Props {
  apartments: Apartment[];
  activeId: string | null;
  onChange: (id: string) => void;
}

export function ApartmentSwitcher({ apartments, activeId, onChange }: Props) {
  if (apartments.length === 0) {
    return null;
  }

  return (
    <div className="apartment-switcher" role="tablist" aria-label="Квартиры">
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
