// Upload.tsx - artist/admin uploads an image, then creates an Artwork.
// Drag/drop OR file input. 8MB limit matches the backend.
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Image as ImageIcon, Check } from 'lucide-react';
import api, { uploadImage } from '../api';
import Spinner from '../components/Spinner';
import { CATEGORIES, type ArtCategory } from '../types';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Step = 'pick' | 'uploading' | 'creating' | 'done';

export default function Upload(): React.ReactElement {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<ArtCategory>('painting');
  const [dragging, setDragging] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [step, setStep] = useState<Step>('pick');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pickFile(f: File | null | undefined): void {
    setErr('');
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setErr('only jpg, png, webp or gif allowed');
      return;
    }
    if (f.size > MAX_BYTES) {
      setErr('image is over the 8MB limit');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    if (!file) {
      setErr('pick an image first');
      return;
    }
    if (!title.trim()) {
      setErr('title is required');
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 1) {
      setErr('price must be a positive number (RWF)');
      return;
    }
    setBusy(true);
    try {
      setStep('uploading');
      const { url } = await uploadImage(file);
      setStep('creating');
      const { data } = await api.post<{ artwork: { _id: string } }>('/artworks', {
        title: title.trim(),
        description: description.trim(),
        price: Math.round(priceNum),
        category,
        imageUrl: url,
      });
      setStep('done');
      nav(`/art/${data.artwork._id}`, { replace: true });
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      setErr(ax?.response?.data?.error || 'upload failed');
      setStep('pick');
    } finally {
      setBusy(false);
    }
  }

  const stepIdx: Record<Step, number> = { pick: 0, uploading: 1, creating: 2, done: 3 };
  const currentIdx = stepIdx[step];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 kz-fade-up">
      <h1 className="kz-section-title text-2xl sm:text-3xl">upload artwork</h1>
      <p className="kz-section-sub mb-6">
        pick a jpg/png/webp/gif under 8MB. we upload it first, then create the
        artwork with a title, price, and category.
      </p>

      {/* stepper */}
      <div className="flex items-center gap-2 mb-6">
        {['pick image', 'uploading', 'publishing', 'done'].map((label, i) => {
          const status: 'done' | 'active' | 'idle' =
            i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'idle';
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`kz-step-dot ${status === 'done' ? 'is-done' : ''} ${status === 'active' ? 'is-active' : ''}`}
                />
                <span
                  className={`text-xs capitalize ${
                    status === 'idle' ? 'text-kartz-mute' : 'text-white'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 3 && <div className="flex-1 h-px bg-kartz-line" />}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`kz-card p-6 cursor-pointer text-center transition ${
            dragging
              ? 'border-kartz-cyan shadow-glow'
              : 'hover:border-kartz-cyan/40'
          }`}
        >
          {preview ? (
            <div className="space-y-2">
              <img
                src={preview}
                alt="preview"
                className="max-h-72 mx-auto rounded-md border border-kartz-line"
              />
              <p className="text-xs text-kartz-mute">
                {file?.name} · {Math.round((file?.size || 0) / 1024)} KB · click or drop to replace
              </p>
            </div>
          ) : (
            <div className="py-10 text-kartz-mute">
              <UploadCloud size={36} className="mx-auto text-kartz-cyan mb-2" />
              <p className="text-kartz-cyan font-display text-lg">drop image here</p>
              <p className="text-sm">or click to choose a file</p>
              <p className="text-xs mt-2">jpg / png / webp / gif · up to 8MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>

        <div className="kz-card p-5 space-y-3">
          <div>
            <label className="kz-label" htmlFor="up-title">title</label>
            <input
              id="up-title"
              className="kz-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Kigali Skyline at Dusk"
            />
          </div>
          <div>
            <label className="kz-label" htmlFor="up-desc">description</label>
            <textarea
              id="up-desc"
              className="kz-input min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              placeholder="medium, size, story behind the piece…"
            />
          </div>
          <div className="kz-form-row cols-2">
            <div>
              <label className="kz-label" htmlFor="up-price">price (RWF)</label>
              <input
                id="up-price"
                className="kz-input"
                type="number"
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="e.g. 25000"
              />
            </div>
            <div>
              <label className="kz-label" htmlFor="up-cat">category</label>
              <select
                id="up-cat"
                className="kz-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ArtCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button type="submit" disabled={busy} className="kz-btn w-full justify-center text-base py-3">
          {step === 'uploading' && (
            <>
              <Spinner size={16} className="mr-2" /> uploading image…
            </>
          )}
          {step === 'creating' && (
            <>
              <Spinner size={16} className="mr-2" /> creating artwork…
            </>
          )}
          {step === 'pick' && (
            <>
              <ImageIcon size={16} className="mr-2" /> publish artwork
            </>
          )}
          {step === 'done' && (
            <>
              <Check size={16} className="mr-2" /> done — redirecting…
            </>
          )}
        </button>
      </form>
    </div>
  );
}
