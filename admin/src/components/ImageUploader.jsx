import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SERVER_URL = API_BASE_URL.replace('/api', '');

const ImageUploader = ({
  label,
  recommendedSize = "1920x700px",
  value,
  onChange
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/departments/upload-image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        onChange(data.image_url);
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div>
      {label && <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '6px', display: 'block' }}>{label}</label>}

      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '16px', backgroundColor: '#f8fafc', position: 'relative', textAlign: 'center' }}>
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center' }}>
            <img 
              src={getFullUrl(value)} 
              alt="Preview" 
              style={{ maxHeight: '110px', maxWidth: '100%', borderRadius: '10px', objectFit: 'cover', border: '2px solid #00a3c8' }} 
            />
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', display: 'block', marginBottom: '4px' }}>✓ Image Uploaded</span>
              <button
                type="button"
                onClick={() => onChange('')}
                style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={14} /> Remove Image
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Upload size={28} color="#00a3c8" style={{ marginBottom: '6px' }} />
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
              {uploading ? 'Uploading image...' : 'Click to select image file'}
            </p>
            {recommendedSize && (
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                Recommended size: {recommendedSize}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
