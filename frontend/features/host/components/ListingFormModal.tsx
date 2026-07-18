import { ImagePlus, Trash2, X } from 'lucide-react';
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { hostApi } from '@/features/host/api';
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
  const [uploading, setUploading] = useState(false);
  const images = form.images
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    if (images.length + files.length > 10) {
      toast.error('A listing can have up to 10 photos');
      return;
    }
    const invalid = files.find((file) => !file.type.startsWith('image/') || file.size > 10_000_000);
    if (invalid) {
      toast.error('Choose image files smaller than 10 MB');
      return;
    }
    setUploading(true);
    try {
      const uploadedUrls = await hostApi.uploadImages(files);
      set('images', [...images, ...uploadedUrls].join(', '));
      toast.success(`${uploadedUrls.length} photo${uploadedUrls.length === 1 ? '' : 's'} uploaded`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    set(
      'images',
      images.filter((_, imageIndex) => imageIndex !== index).join(', '),
    );
  }

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
          <section className="listing-photo-upload wide">
            <div>
              <b>Photos</b>
              <span>Upload up to 10 JPG, PNG or WebP images.</span>
            </div>
            <label className="cloud-upload-button">
              <ImagePlus size={19} />
              {uploading ? 'Uploading...' : 'Upload photos'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading}
                onChange={uploadFiles}
              />
            </label>
            {images.length > 0 && (
              <div className="listing-photo-previews">
                {images.map((image, index) => (
                  <figure key={`${image}-${index}`}>
                    {/* Cloudinary and host-entered URLs are intentionally rendered directly. */}
                    <img src={image} alt={`Listing photo ${index + 1}`} />
                    <button type="button" onClick={() => removeImage(index)} aria-label="Remove photo">
                      <Trash2 size={15} />
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </section>
          <label className="wide">
            Image URLs, comma separated
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
