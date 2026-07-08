import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  HiOutlinePlus, HiOutlineX, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';
import Nav from '../../../src/assets/nav.jsx';
import useContext from '../../context/context.js';


const COLORS = {
  ink: '#0B1F17',
  paper: '#F5F1E8',
  granted: '#3FA66B',
  denied: '#C24B3F',
  pending: '#D9A23B',
  sage: '#9CA89C',
};

const MAX_VEHICLES = 3;

const statusConfig = {
  pending: { label: 'Pending review', color: COLORS.pending, icon: HiOutlineClock },
  approved: { label: 'Approved', color: COLORS.granted, icon: HiOutlineCheckCircle },
  denied: { label: 'Denied', color: COLORS.denied, icon: HiOutlineExclamationCircle },
};

const QrCodePage = () => {
  const setToast = useContext((state) => state.setToast)
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    ownerName: '',
    idNumber: '',
    department: '',
    vehicleMake: '',
    vehicleModel: '',
    plateNumber: '',
    vehicleColour: '',
    phoneNumber: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/vehicles/mine');
      setVehicles(res.data);
    } catch (err) {
      setToast('Failed to fetch vehicles check connection and refresh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const missing = Object.entries(form).some(([, value]) => !value.trim());
    if (missing) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value.trim()));
      if (proofFile) payload.append('proofOfOwnership', proofFile);

      const res = await axios.post('/api/vehicles/request', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVehicles((prev) => [...prev, res.data]);
      setForm(emptyForm);
      setProofFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit request. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const atLimit = vehicles.length >= MAX_VEHICLES;

  const handleDelete = async (vehicleId) => {
    try {
      await axios.delete(`/api/vehicles/${vehicleId}`);
      setVehicles((prev) => prev.filter((v) => (v._id || v.id) !== vehicleId));
      setToast('Vehicle removed');
    } catch (err) {
      setToast(err?.response?.data?.message || 'Failed to delete vehicle');
    }
  };


  return (
    <div style={{ background: COLORS.ink, color: COLORS.paper, minHeight: '100vh' }}>
      <Nav />

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
              My vehicles
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {vehicles.length} of {MAX_VEHICLES} registered
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            disabled={atLimit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: COLORS.paper, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <HiOutlinePlus size={16} />
            Add vehicle
          </button>
        </div>

        {atLimit && (
          <p
            className="text-sm mb-6 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(217,162,59,0.1)', color: COLORS.pending, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            You've reached the 3-vehicle limit. Remove a vehicle to add a new one.
          </p>
        )}

        {/* Vehicle list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(245,241,232,0.05)' }} />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl border border-dashed"
            style={{ borderColor: 'rgba(245,241,232,0.15)' }}
          >
            <p className="text-base font-medium mb-1" style={{ fontFamily: 'Georgia, serif' }}>No vehicles yet</p>
            <p className="text-sm" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Add your plate number to request gate access.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {vehicles.map((v) => (
                <VehicleCard key={v._id || v.id} vehicle={v} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Request form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ background: COLORS.ink, border: '1px solid rgba(245,241,232,0.12)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                  Add a vehicle
                </h2>
                <button onClick={() => setShowForm(false)} style={{ color: COLORS.sage }}>
                  <HiOutlineX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <FormField label="Owner's name" value={form.ownerName} onChange={updateField('ownerName')} placeholder="e.g. Amina Yusuf" autoFocus />
                <FormField label="Matric / Staff ID" value={form.idNumber} onChange={updateField('idNumber')} placeholder="e.g. CST/20/1234" />
                <FormField label="Department / Faculty" value={form.department} onChange={updateField('department')} placeholder="e.g. Computer Science" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Vehicle make" value={form.vehicleMake} onChange={updateField('vehicleMake')} placeholder="e.g. Toyota" />
                  <FormField label="Vehicle model" value={form.vehicleModel} onChange={updateField('vehicleModel')} placeholder="e.g. Corolla" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Plate number"
                    value={form.plateNumber}
                    onChange={(e) => setForm((p) => ({ ...p, plateNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. KJA 204 XY"
                  />
                  <FormField label="Vehicle colour" value={form.vehicleColour} onChange={updateField('vehicleColour')} placeholder="e.g. Silver" />
                </div>
                <FormField label="Phone number" value={form.phoneNumber} onChange={updateField('phoneNumber')} placeholder="e.g. 08012345678" type="tel" />

                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                    style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    Proof of ownership <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold"
                    style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>

                {error && (
                  <p className="text-sm" style={{ color: COLORS.denied, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full font-semibold text-sm transition-transform hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: COLORS.paper, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {submitting ? 'Submitting…' : 'Submit request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormField = ({ label, value, onChange, placeholder, autoFocus, type = 'text' }) => (
  <div>
    <label
      className="text-xs font-semibold uppercase tracking-widest mb-2 block"
      style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-4 py-3 rounded-xl outline-none text-sm tracking-wide"
      style={{
        background: 'rgba(245,241,232,0.04)',
        border: '1px solid rgba(245,241,232,0.15)',
        color: COLORS.paper,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    />
  </div>
);

const VehicleCard = ({ vehicle, onDelete }) => {
  const { plateNumber, status, vehicleMake, vehicleModel, vehicleColour } = vehicle;
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTrashClick = () => {
    if (deleting) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    onDelete(vehicle._id || vehicle.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl p-5 border"
      style={{ borderColor: 'rgba(245,241,232,0.1)', background: 'rgba(245,241,232,0.03)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="font-semibold tracking-wider text-sm"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {plateNumber}
        </span>
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: `${config.color}1A`, color: config.color, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <Icon size={13} />
          {config.label}
        </span>
      </div>

      {(vehicleMake || vehicleModel || vehicleColour) && (
        <p className="text-xs mb-3" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
          {[vehicleColour, vehicleMake, vehicleModel].filter(Boolean).join(' · ')}
        </p>
      )}

      {status === 'approved' && vehicle.qrToken && (
        <div className="flex flex-col items-center pt-2 pb-1">
          <div className="p-3 rounded-xl" style={{ background: COLORS.paper }}>
            <QRCodeSVG value={vehicle.qrToken} size={140} />
          </div>
          <p className="text-xs mt-3" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Show this at the gate
          </p>
        </div>
      )}

      {status === 'denied' && vehicle.deniedReason && (
        <p className="text-sm" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Reason: {vehicle.deniedReason}
        </p>
      )}

      {status === 'pending' && (
        <p className="text-[12px] sm:text-sm" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Waiting on admin approval — you'll see your QR code here once approved.
        </p>
      )}
      <div className="flex items-center justify-between mt-5">
        {confirming ? (
          <div className="flex items-center gap-3 text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <span style={{ color: COLORS.sage }}>Remove this vehicle?</span>
            <button
              onClick={handleTrashClick}
              disabled={deleting}
              className="font-semibold px-3 py-1 rounded-full"
              style={{ background: `${COLORS.denied}1A`, color: COLORS.denied }}
            >
              {deleting ? 'Removing…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="font-medium"
              style={{ color: COLORS.sage }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <FaTrash
            size={16}
            className="cursor-pointer hover:text-red-500 transition-colors"
            style={{ color: COLORS.sage }}
            onClick={handleTrashClick}
          />
        )}
      </div>
    </motion.div>
  );
};

export default QrCodePage;












