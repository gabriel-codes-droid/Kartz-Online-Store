// Upload.tsx - artist/admin uploads an image, then creates an Artwork.
// Drag/drop OR file input. 8MB limit matches the backend.
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadImage } from '../api';
import Spinner from '../components/Spinner';
import { CATEGORIES, type ArtCategory } from '../types';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
  const [step, setStep] = useState<'pick' | 'uploading' | 'creating' | 'done'>('pick');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pickFile(f: File | null | undefined) {
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

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl mb-1">upload artwork</h1>
      <p className="text-kartz-mute text-sm mb-6">
        pick a jpg/png/webp/gif under 8MB. we upload it first, then create the
        artwork with a title, price, and category.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`kz-card p-6 cursor-pointer text-center transition ${
            dragging ? 'border-kartz-cyan shadow-glow' : ''
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
                {file?.name} · {Math.round((file?.size || 0) / 1024)} KB · click
                or drop to replace
              </p>
            </div>
          ) : (
            <div className="py-10 text-kartz-mute">
              <p className="text-kartz-cyan font-display text-lg">
                drop image here
              </p>
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
            <label className="kz-label">title</label>
            <input
              className="kz-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label className="kz-label">description</label>
            <textarea
              className="kz-input min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="kz-label">price (RWF)</label>
              <input
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
              <label className="kz-label">category</label>
              <select
                className="kz-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ArtCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button type="submit" disabled={busy} className="kz-btn w-full">
          {step === 'uploading' && <Spinner size={16} />}
          {step === 'creating' && <Spinner size={16} />}
          {step === 'uploading' && ' uploading image…'}
          {step === 'creating' && ' creating artwork…'}
          {step === 'pick' && ' publish artwork'}
          {step === 'done' && ' done — redirecting…'}
        </button>
      </form>
    </div>
  );
}
