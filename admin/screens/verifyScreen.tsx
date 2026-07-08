import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, SafeAreaView, Alert, RefreshControl, Modal,
  TextInput, ScrollView, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import useToast from '../context/toast';

type Props = { token: string };

type Vehicle = {
  _id: string;
  plateNumber: string;
  status: string;
  owner: { name: string; email: string; type: string };
  createdAt: string;
};

// Full detail payload from GET /api/vehicles/:id/details — owner is fully
// populated (minus password) rather than the trimmed name/email/type used
// in the pending list, so this may contain fields beyond what's typed here.
type VehicleDetail = Vehicle & {
  ownerName?: string;
  idNumber?: string;
  department?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColour?: string;
  phoneNumber?: string;
  proofOfOwnershipUrl?: string | null;
  owner: Record<string, any>;
  [key: string]: any;
};

type GateLog = {
  _id: string;
  vehicle: { plateNumber: string; _id: string };
  direction: 'in' | 'out';
  scannedAt: string;
  scannedBy: { name: string };
  result: string;
};

type Tab = 'requests' | 'tracker';

export default function VerifyScreen({ token }: Props) {
  const [tab, setTab] = useState<Tab>('requests');
  const [pending, setPending] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [denyModal, setDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const setToast = useToast((state) => state.setToast);


  const headers = { Authorization: `Bearer ${token}` };

  const openDetails = async (vehicleId: string) => {
    setDetailModal(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await axios.get(`${API_URL}/api/vehicles/${vehicleId}/details`, { headers });
      setDetail(res.data);
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'Failed to fetch vehicle details', 'error');
      setDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vehicles/pending`, { headers });
      setPending(res.data);
    } catch (err: any) {
      setToast('Failed to fetch requests', 'error');
    }
  };

  const fetchTodayLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/gate-logs`, { headers });
      // Filter to today only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = res.data.filter((log: GateLog) =>
        new Date(log.scannedAt) >= today
      );
      setLogs(todayLogs);
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'Failed to fetch logs', 'error');
    }
  };

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    if (tab === 'requests') await fetchPending();
    else await fetchTodayLogs();
    isRefresh ? setRefreshing(false) : setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [tab]);

  const approve = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/api/vehicles/${id}/approve`, {}, { headers });
      setPending(prev => prev.filter(v => v._id !== id));
      setToast('Vehicle has been approved and QR code generated', 'success');
    } catch (err: any) {
      setToast('Failed to approve','error');
    }
  };

  const openDenyModal = (id: string) => {
    setSelectedId(id);
    setDenyReason('');
    setDenyModal(true);
  };

  const confirmDeny = async () => {
    if (!denyReason.trim()) {
      setToast('Please provide a reason for denial', 'info');
      return;
    }
    try {
      await axios.patch(
        `${API_URL}/api/vehicles/${selectedId}/deny`,
        { reason: denyReason },
        { headers }
      );
      setPending(prev => prev.filter(v => v._id !== selectedId));
      setDenyModal(false);
      setToast('Vehicle request has been denied','info');
    } catch (err: any) {
      setToast('Failed to deny','error');
    }
  };

  // For tracker — find vehicles that checked in today but haven't checked out
  const stillInside = (() => {
    const vehicleLastLog: Record<string, GateLog> = {};
    [...logs].reverse().forEach(log => {
      const id = log.vehicle?._id;
      if (id && !vehicleLastLog[id]) vehicleLastLog[id] = log;
    });
    return Object.values(vehicleLastLog).filter(log => log.direction === 'in');
  })();

  const formatTime = (str: string) =>
    new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Verify & Track</Text>

      {/* Inner tabs */}
      <View style={styles.innerTabs}>
        <TouchableOpacity
          style={[styles.innerTab, tab === 'requests' && styles.innerTabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.innerTabText, tab === 'requests' && styles.innerTabTextActive]}>
            Requests {pending.length > 0 && tab !== 'requests' ? `(${pending.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.innerTab, tab === 'tracker' && styles.innerTabActive]}
          onPress={() => setTab('tracker')}
        >
          <Text style={[styles.innerTabText, tab === 'tracker' && styles.innerTabTextActive]}>
            Today's Tracker
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF8A" style={{ marginTop: 40 }} />
      ) : tab === 'requests' ? (
        // ── REQUESTS TAB ──────────────────────────────────────────────────────
        <FlatList
          data={pending}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#4CAF8A" />}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#6B8080" />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <TouchableOpacity style={styles.requestInfo} onPress={() => openDetails(item._id)} activeOpacity={0.7}>
                <View style={styles.plateBox}>
                  <Ionicons name="car-outline" size={16} color="#4CAF8A" />
                  <Text style={styles.plate}>{item.plateNumber}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#6B8080" style={{ marginLeft: 2 }} />
                </View>
                <Text style={styles.ownerName}>{item.owner?.name}</Text>
                <Text style={styles.ownerEmail}>{item.owner?.email}</Text>
                <Text style={styles.ownerType}>{item.owner?.type}</Text>
              </TouchableOpacity>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => Alert.alert('Approve', `Approve ${item.plateNumber}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Approve', onPress: () => approve(item._id) },
                  ])}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.denyBtn}
                  onPress={() => openDenyModal(item._id)}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Deny</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        // ── TRACKER TAB ───────────────────────────────────────────────────────
        <FlatList
          data={logs}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#4CAF8A" />}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            stillInside.length > 0 ? (
              <View style={styles.alertBanner}>
                <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                <Text style={styles.alertText}>
                  {stillInside.length} vehicle{stillInside.length > 1 ? 's' : ''} still inside
                </Text>
              </View>
            ) : (
              <View style={styles.allClearBanner}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF8A" />
                <Text style={styles.allClearText}>All vehicles have checked out</Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#6B8080" />
              <Text style={styles.emptyText}>No activity today</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isIn = item.direction === 'in';
            const isStillInside = stillInside.some(l => l._id === item._id);
            return (
              <View style={[styles.logCard, isStillInside && styles.logCardWarning]}>
                <View style={[styles.iconBox, { backgroundColor: isIn ? '#4CAF8A20' : '#E0555520' }]}>
                  <Ionicons
                    name={isIn ? 'log-in-outline' : 'log-out-outline'}
                    size={20} color={isIn ? '#4CAF8A' : '#E05555'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logPlate}>{item.vehicle?.plateNumber}</Text>
                  <Text style={styles.logTime}>{formatTime(item.scannedAt)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.badge, { backgroundColor: isIn ? '#4CAF8A20' : '#E0555520' }]}>
                    <Text style={[styles.badgeText, { color: isIn ? '#4CAF8A' : '#E05555' }]}>
                      {isIn ? 'In' : 'Out'}
                    </Text>
                  </View>
                  {isStillInside && (
                    <View style={styles.insideBadge}>
                      <Text style={styles.insideBadgeText}>Still Inside</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Deny Modal */}
      <Modal visible={denyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Deny Request</Text>
            <Text style={styles.modalSubtitle}>Provide a reason for denial</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Incomplete documents"
              placeholderTextColor="#4A6060"
              value={denyReason}
              onChangeText={setDenyReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setDenyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeny} onPress={confirmDeny}>
                <Text style={styles.modalDenyText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vehicle Details Modal */}
      <Modal visible={detailModal} transparent animationType="slide" onRequestClose={() => setDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '85%' }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>Vehicle details</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}>
                <Ionicons name="close" size={24} color="#6B8080" />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <ActivityIndicator size="large" color="#4CAF8A" style={{ marginVertical: 40 }} />
            ) : detail ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailSectionTitle}>Vehicle</Text>
                <DetailRow label="Plate number" value={detail.plateNumber} />
                <DetailRow label="Make" value={detail.vehicleMake} />
                <DetailRow label="Model" value={detail.vehicleModel} />
                <DetailRow label="Colour" value={detail.vehicleColour} />
                <DetailRow label="Status" value={detail.status} />
                <DetailRow label="Registered on" value={detail.createdAt ? new Date(detail.createdAt).toLocaleString() : undefined} />

                <Text style={[styles.detailSectionTitle, { marginTop: 16 }]}>Registered by</Text>
                <DetailRow label="Name" value={detail.ownerName} />
                <DetailRow label="Matric / Staff ID" value={detail.idNumber} />
                <DetailRow label="Department / Faculty" value={detail.department} />
                <DetailRow label="Phone" value={detail.phoneNumber} />

                <Text style={[styles.detailSectionTitle, { marginTop: 16 }]}>Owner account</Text>
                {Object.entries(detail.owner || {})
                  .filter(([key]) => !HIDDEN_OWNER_KEYS.includes(key))
                  .map(([key, value]) => (
                    <DetailRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                  ))}

                {detail.proofOfOwnershipUrl && (
                  <>
                    <Text style={[styles.detailSectionTitle, { marginTop: 16 }]}>Proof of ownership</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}${detail.proofOfOwnershipUrl}`)}>
                      <Text style={styles.proofLink}>Open document</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No details found</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const HIDDEN_OWNER_KEYS = ['_id', '__v', 'password', 'refreshToken', 'tokens', 'createdAt', 'updatedAt'];

const formatLabel = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value && value !== '' ? value : '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C2B2B', padding: 24, paddingTop: 48 },
  title: { color: '#E8F0EE', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  innerTabs: { flexDirection: 'row', backgroundColor: '#162222', borderRadius: 12, padding: 4, marginBottom: 20 },
  innerTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  innerTabActive: { backgroundColor: '#4CAF8A' },
  innerTabText: { color: '#6B8080', fontSize: 13, fontWeight: '600' },
  innerTabTextActive: { color: '#fff' },
  requestCard: { backgroundColor: '#162222', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2E4040', gap: 12 },
  requestInfo: { gap: 4 },
  plateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  plate: { color: '#E8F0EE', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  ownerName: { color: '#E8F0EE', fontSize: 14, fontWeight: '600' },
  ownerEmail: { color: '#6B8080', fontSize: 12 },
  ownerType: { color: '#4CAF8A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  requestActions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4CAF8A', paddingVertical: 12, borderRadius: 12 },
  denyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E05555', paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#162222', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: '#2E4040' },
  logCardWarning: { borderColor: '#F59E0B40', backgroundColor: '#F59E0B08' },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logPlate: { fontSize: 14, fontWeight: '700', color: '#E8F0EE', letterSpacing: 1 },
  logTime: { fontSize: 12, color: '#6B8080', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  insideBadge: { backgroundColor: '#F59E0B20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  insideBadgeText: { color: '#F59E0B', fontSize: 10, fontWeight: '700' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F59E0B15', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F59E0B30' },
  alertText: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },
  allClearBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4CAF8A15', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#4CAF8A30' },
  allClearText: { color: '#4CAF8A', fontWeight: '600', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5, paddingTop: 60 },
  emptyText: { color: '#6B8080', fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1C2B2B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalTitle: { color: '#E8F0EE', fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: '#6B8080', fontSize: 13 },
  modalInput: { backgroundColor: '#162222', borderRadius: 14, padding: 14, color: '#E8F0EE', fontSize: 14, borderWidth: 1, borderColor: '#2E4040', minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#162222', borderWidth: 1, borderColor: '#2E4040' },
  modalCancelText: { color: '#6B8080', fontWeight: '700' },
  modalDeny: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#E05555' },
  modalDenyText: { color: '#fff', fontWeight: '700' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  detailSectionTitle: { color: '#4CAF8A', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2E4040', gap: 12 },
  detailLabel: { color: '#6B8080', fontSize: 13, flexShrink: 0 },
  detailValue: { color: '#E8F0EE', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  proofLink: { color: '#4CAF8A', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline', marginTop: 4 },
});