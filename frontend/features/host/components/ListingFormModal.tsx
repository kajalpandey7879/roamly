import { X } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import type { ListingFormState } from '@/features/host/form-model';

interface ListingFormModalProps {
  editing: boolean;
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export default function ListingFormModal({
  editing,
  form,
  setForm,
  onClose,
  onSubmit,
}: ListingFormModalProps) {
  const set = <Key extends keyof ListingFormState>(key: Key, value: ListingFormState[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="listing-form" onSubmit={onSubmit}>
        <header>
          <div>
            <small>{editing ? 'EDIT HOME' : 'NEW HOME'}</small>
            <h2>{editing ? 'Update your listing' : 'List your place'}</h2>
          </div>
          <button type="button" title="Close" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="form-grid">
          <TextField
            label="Title"
            wide
            value={form.title}
            onChange={(value) => set('title', value)}
          />
          <label className="wide">
            Description
            <textarea
              required
              minLength={20}
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
            />
          </label>
          <TextField label="City" value={form.city} onChange={(value) => set('city', value)} />
          <TextField
            label="Country"
            value={form.country}
            onChange={(value) => set('country', value)}
          />
          <TextField
            label="Property type"
            value={form.property_type}
            onChange={(value) => set('property_type', value)}
          />
          <TextField
            label="Category"
            value={form.category}
            onChange={(value) => set('category', value)}
          />
          <NumberField
            label="Price per night"
            value={form.price}
            onChange={(value) => set('price', value)}
          />
          <NumberField
            label="Max guests"
            value={form.max_guests}
            onChange={(value) => set('max_guests', value)}
          />
          <NumberField
            label="Bedrooms"
            value={form.bedrooms}
            onChange={(value) => set('bedrooms', value)}
          />
          <NumberField label="Beds" value={form.beds} onChange={(value) => set('beds', value)} />
          <NumberField label="Baths" value={form.baths} onChange={(value) => set('baths', value)} />
          <TextField
            label="Amenities, comma separated"
            wide
            value={form.amenities}
            onChange={(value) => set('amenities', value)}
          />
          <label className="wide">
            Photo URLs, comma separated
            <textarea
              required
              value={form.images}
              onChange={(event) => set('images', event.target.value)}
            />
          </label>
        </div>
        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary compact">
            {editing ? 'Save changes' : 'Publish listing'}
          </button>
        </footer>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}
function TextField({ label, value, onChange, wide = false }: FieldProps) {
  return (
    <label className={wide ? 'wide' : ''}>
      {label}
      <input
        required
        minLength={label === 'Title' ? 5 : 1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        required
        type="number"
        min={label === 'Bedrooms' ? 0 : 1}
        step={label === 'Baths' ? '.5' : '1'}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
