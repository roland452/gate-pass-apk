import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, SafeAreaView, Alert, RefreshControl, Modal,
  TextInput, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import useToast from '../context/toast';

type Props = { token: string };

type Vehicle = {
  _id: string;
  ownerName: string;
  idNumber: string;
  department: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  vehicleColour: string;
  phoneNumber: string;
  proofOfOwnershipUrl: string | null;
  status: string;
  owner: { name: string; email: string; type: string };
  createdAt: string;
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
  const setToast = useToast((state) => state.setToast);


  const headers = { Authorization: `Bearer ${token}` };

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
      setToast('Error', err?.response?.data?.message || 'Failed to fetch logs');
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
              <View style={styles.requestInfo}>
                <View style={styles.plateBox}>
                  <Ionicons name="car-outline" size={16} color="#4CAF8A" />
                  <Text style={styles.plate}>{item.plateNumber}</Text>
                  {!!item.vehicleColour && <Text style={styles.vehicleMeta}>{item.vehicleColour}</Text>}
                </View>
                {(item.vehicleMake || item.vehicleModel) && (
                  <Text style={styles.vehicleMeta}>{[item.vehicleMake, item.vehicleModel].filter(Boolean).join(' ')}</Text>
                )}
                <Text style={styles.ownerName}>{item.ownerName || item.owner?.name}</Text>
                <Text style={styles.ownerEmail}>{item.idNumber} · {item.department}</Text>
                <Text style={styles.ownerEmail}>{item.phoneNumber}</Text>
                <Text style={styles.ownerType}>{item.owner?.type}</Text>
                {item.proofOfOwnershipUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(`${API_URL}${item.proofOfOwnershipUrl}`)}>
                    <Text style={styles.proofLink}>View proof of ownership</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    </SafeAreaView>
  );
}

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
  vehicleMeta: { color: '#6B8080', fontSize: 12, fontWeight: '600' },
  proofLink: { color: '#4CAF8A', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline', marginTop: 2 },
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
});