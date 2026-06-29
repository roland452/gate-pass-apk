import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCamera, HiOutlineMail, HiOutlineIdentification } from 'react-icons/hi';
import axios from 'axios';
import Nav from '../../../src/assets/nav.jsx';
import useContext from '../../context/context.js';

const COLORS = {
  ink: '#0B1F17',
  paper: '#F5F1E8',
  granted: '#3FA66B',
  sage: '#9CA89C',
};

const typeLabels = {
  student: 'Student',
  lecturer: 'Lecturer',
  other: 'Other',
};

const ProfilePage = () => {
  const setToast = useContext((state) => state.setToast)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/profile');
        setUser(res.data);
      } catch (err) {
        setToast('Failed to fetch profile check connection and refresh');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic guardrails before sending anything to the server
    if (!file.type.startsWith('image/')) {
      setToast('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast('Image must be under 5MB');
      return;
    }

    // Instant local preview while the upload is in flight
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await axios.patch('/api/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser((prev) => ({ ...prev, photoUrl: res.data.photoUrl }));
      setToast('Profile picture updated');
    } catch (err) {
      setToast(err?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      e.target.value = ''; // allow re-selecting the same file again later
    }
  };

  const displayedPhoto = previewUrl || user?.photoUrl;

  return (
    <div style={{ background: COLORS.ink, color: COLORS.paper, minHeight: '100vh' }}>
      <Nav />

      <div className="max-w-2xl mx-auto px-6 md:px-12 py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Profile
        </h1>

        {loading ? (
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(245,241,232,0.05)' }} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 border flex flex-col items-center text-center"
            style={{ borderColor: 'rgba(245,241,232,0.1)', background: 'rgba(245,241,232,0.03)' }}
          >
            {/* Photo — clickable, opens file picker */}
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploading}
              className="relative w-24 h-24 rounded-full flex items-center justify-center mb-5 overflow-hidden border-2 group"
              style={{ borderColor: COLORS.granted, background: 'rgba(245,241,232,0.06)' }}
            >
              {displayedPhoto ? (
                <img src={displayedPhoto} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <HiOutlineCamera size={28} style={{ color: COLORS.sage }} />
              )}

              {/* Hover/uploading overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-opacity"
                style={{
                  background: 'rgba(11,31,23,0.6)',
                  opacity: uploading ? 1 : 0,
                }}
              >
                {uploading ? (
                  <span className="text-[10px] font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Uploading…
                  </span>
                ) : null}
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(11,31,23,0.55)' }}
              >
                <HiOutlineCamera size={20} style={{ color: COLORS.paper }} />
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              {user?.name || 'Unnamed user'}
            </h2>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full mb-6"
              style={{ background: 'rgba(63,166,107,0.12)', color: COLORS.granted, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {typeLabels[user?.type] || user?.type}
            </span>

            <div className="w-full space-y-3 text-left">
              <InfoRow icon={<HiOutlineMail size={16} />} label="Email" value={user?.email} />
              <InfoRow icon={<HiOutlineIdentification size={16} />} label="Vehicles approved" value={`${user?.approvedVehicleCount ?? 0} of 3`} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div
    className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
    style={{ background: 'rgba(245,241,232,0.04)' }}
  >
    <span style={{ color: '#9CA89C' }}>{icon}</span>
    <div>
      <p className="text-xs" style={{ color: '#9CA89C', fontFamily: 'Inter, system-ui, sans-serif' }}>{label}</p>
      <p className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{value || '—'}</p>
    </div>
  </div>
);

export default ProfilePage;

