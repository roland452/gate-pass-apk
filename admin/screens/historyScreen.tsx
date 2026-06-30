import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, SafeAreaView,
  RefreshControl, SectionList, Modal, Image, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';

type Props = { token: string };

type LogEntry = {
  _id: string;
  direction: 'in' | 'out';
  result: 'granted' | 'denied';
  scannedAt: string;
  plateNumber: string;
  gate: string;
  denialReason?: string;
};

type LogDetail = LogEntry & {
  currentLocation?: 'in' | 'out';
  scannedBy?: { name: string; email: string } | null;
  owner?: { name: string; email: string; photoUrl?: string; type: string } | null;
};

type GroupedLogs = {
  date: string;
  logs: LogEntry[];
};

type Stats = {
  totalIn: number;
  totalOut: number;
  totalDenied: number;
  todayLogs: number;
};

const FILTERS = ['all', 'in', 'out', 'pending'] as const;
type Filter = typeof FILTERS[number];

export default function HistoryScreen({ token }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [grouped, setGrouped] = useState<GroupedLogs[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<LogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const openDetail = async (logId: string) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/gate-logs/${logId}/detail`, { headers });
      setSelectedLog(res.data.data);
    } catch (err) {
      setSelectedLog(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedLog(null);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/gate-logs/stats`, { headers });
      setStats(res.data.data);
    } catch (err) {}
  };

  const fetchLogs = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) isRefresh ? setRefreshing(true) : setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get(
        `${API_URL}/api/gate-logs/my-history?filter=${filter}&page=${pageNum}&limit=20`,
        { headers }
      );

      if (pageNum === 1) {
        setGrouped(res.data.data);
      } else {
        // Merge new data with existing — combine same dates
        setGrouped(prev => {
          const merged = [...prev];
          res.data.data.forEach((newGroup: GroupedLogs) => {
            const existing = merged.find(g => g.date === newGroup.date);
            if (existing) {
              existing.logs = [...existing.logs, ...newGroup.logs];
            } else {
              merged.push(newGroup);
            }
          });
          return merged;
        });
      }

      setHasMore(res.data.hasMore);
      setPage(pageNum);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setGrouped([]);
    setPage(1);
    fetchLogs(1);
  }, [filter]);

  const onRefresh = () => fetchLogs(1, true);
  const onLoadMore = () => { if (hasMore && !loadingMore) fetchLogs(page + 1); };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Convert grouped data to SectionList format
  const sections = grouped.map(g => ({ title: g.date, data: g.logs }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gate History</Text>
        <Text style={styles.subtitle}>All vehicle entry & exit records</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#4CAF8A30' }]}>
            <Text style={[styles.statNum, { color: '#4CAF8A' }]}>{stats.totalIn}</Text>
            <Text style={styles.statLabel}>Check Ins</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#E0555530' }]}>
            <Text style={[styles.statNum, { color: '#E05555' }]}>{stats.totalOut}</Text>
            <Text style={styles.statLabel}>Check Outs</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F59E0B30' }]}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.todayLogs}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#6B808030' }]}>
            <Text style={[styles.statNum, { color: '#6B8080' }]}>{stats.totalDenied}</Text>
            <Text style={styles.statLabel}>Denied</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'in' ? '🟢 Entry' : f === 'out' ? '🔴 Exit' : '🟡 Still In'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF8A" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color="#6B8080" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLogs(1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : grouped.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={48} color="#6B8080" />
          <Text style={styles.emptyText}>No gate logs found</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          stickySectionHeadersEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF8A" />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length} records</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isIn = item.direction === 'in';
            const isGranted = item.result === 'granted';
            const color = !isGranted ? '#F59E0B' : isIn ? '#4CAF8A' : '#E05555';

            return (
              <TouchableOpacity activeOpacity={0.7} onPress={() => openDetail(item._id)} style={styles.logCard}>
                <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
                  <Ionicons
                    name={!isGranted ? 'ban-outline' : isIn ? 'log-in-outline' : 'log-out-outline'}
                    size={22} color={color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.logTop}>
                    <Text style={styles.logPlate}>{item.plateNumber}</Text>
                    <Text style={styles.logTime}>{formatTime(item.scannedAt)}</Text>
                  </View>
                  {item.denialReason ? (
                    <Text style={styles.denialReason}>⚠️ {item.denialReason}</Text>
                  ) : null}
                  <Text style={styles.logGate}>Gate: {item.gate}</Text>
                </View>

                <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
                  <Text style={[styles.badgeText, { color }]}>
                    {!isGranted ? 'Denied' : isIn ? 'In' : 'Out'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={loadingMore ? (
            <ActivityIndicator size="small" color="#4CAF8A" style={{ marginTop: 16 }} />
          ) : null}
        />
      )}

      {/* Detail modal */}
      <Modal visible={detailVisible} transparent animationType="fade" onRequestClose={closeDetail}>
        <Pressable style={styles.modalOverlay} onPress={closeDetail}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {detailLoading ? (
              <ActivityIndicator size="large" color="#4CAF8A" style={{ marginVertical: 24 }} />
            ) : !selectedLog ? (
              <Text style={styles.emptyText}>Could not load details</Text>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  {selectedLog.owner?.photoUrl ? (
                    <Image source={{ uri: selectedLog.owner.photoUrl }} style={styles.modalAvatar} />
                  ) : (
                    <View style={[styles.modalAvatar, styles.modalAvatarFallback]}>
                      <Ionicons name="person" size={26} color="#6B8080" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalName}>{selectedLog.owner?.name || 'Unknown user'}</Text>
                    <Text style={styles.modalEmail}>{selectedLog.owner?.email}</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <DetailRow label="Plate number" value={selectedLog.plateNumber} />
                <DetailRow label="Type" value={selectedLog.owner?.type} />
                <DetailRow label="Direction" value={selectedLog.direction === 'in' ? 'Entered' : 'Exited'} />
                <DetailRow label="Result" value={selectedLog.result === 'granted' ? 'Granted' : 'Denied'} />
                {selectedLog.denialReason ? (
                  <DetailRow label="Denial reason" value={selectedLog.denialReason} />
                ) : null}
                <DetailRow label="Gate" value={selectedLog.gate} />
                <DetailRow label="Time" value={new Date(selectedLog.scannedAt).toLocaleString()} />
                <DetailRow label="Scanned by" value={selectedLog.scannedBy?.name} />
                {selectedLog.currentLocation ? (
                  <DetailRow
                    label="Currently"
                    value={selectedLog.currentLocation === 'in' ? 'Still on campus' : 'Off campus'}
                  />
                ) : null}

                <TouchableOpacity style={styles.modalCloseBtn} onPress={closeDetail}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C2B2B' },
  header: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  title: { color: '#E8F0EE', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#6B8080', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#162222', borderRadius: 14,
    padding: 12, alignItems: 'center', borderWidth: 1
  },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#6B8080', fontSize: 10, marginTop: 2, fontWeight: '600' },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  filterBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#162222', alignItems: 'center',
    borderWidth: 1, borderColor: '#2E4040'
  },
  filterBtnActive: { backgroundColor: '#4CAF8A20', borderColor: '#4CAF8A' },
  filterText: { color: '#6B8080', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#4CAF8A' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1C2B2B', paddingHorizontal: 24, paddingVertical: 10
  },
  sectionTitle: { color: '#E8F0EE', fontSize: 13, fontWeight: '800' },
  sectionCount: { color: '#6B8080', fontSize: 11 },

  logCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#162222', marginHorizontal: 24,
    marginBottom: 8, borderRadius: 16, padding: 14,
    gap: 12, borderWidth: 1, borderColor: '#2E4040',
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logPlate: { fontSize: 14, fontWeight: '700', color: '#E8F0EE', letterSpacing: 1 },
  logTime: { fontSize: 12, color: '#6B8080' },
  logGate: { fontSize: 10, color: '#4CAF8A', marginTop: 3, fontWeight: '600' },
  denialReason: { fontSize: 11, color: '#F59E0B', marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.6 },
  emptyText: { color: '#6B8080', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#4CAF8A20', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#4CAF8A', fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#162222',
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2E4040',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  modalAvatar: { width: 52, height: 52, borderRadius: 26 },
  modalAvatarFallback: { backgroundColor: '#1C2B2B', alignItems: 'center', justifyContent: 'center' },
  modalName: { color: '#E8F0EE', fontSize: 16, fontWeight: '800' },
  modalEmail: { color: '#6B8080', fontSize: 12, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: '#2E4040', marginVertical: 14 },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1C2B2B',
  },
  detailLabel: { color: '#6B8080', fontSize: 12, fontWeight: '600' },
  detailValue: { color: '#E8F0EE', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  modalCloseBtn: {
    marginTop: 18, backgroundColor: '#4CAF8A20', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  modalCloseText: { color: '#4CAF8A', fontWeight: '700' },
});