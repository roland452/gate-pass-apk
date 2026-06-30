import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { API_URL, GATE_NAME } from '../constants/config';
import useToast from '../context/toast';

type Props = { token: string };

type ScanResult = {
  name: string;
  plateNumber: string;
  action: 'check-in' | 'check-out';
  time: string;
};

export default function ScanScreen({ token }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const setToast = useToast((state) => state.setToast);

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/vehicles/verify-scan`,
        { qrToken: data, gate: GATE_NAME },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({
        name: res.data.owner.name,
        plateNumber: res.data.plateNumber,
        action: res.data.direction === 'in' ? 'check-in' : 'check-out',
        time: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      const reason = err?.response?.data?.reason || 'Something went wrong';
      setToast('Scan Failed','error');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setScanned(false); setResult(null); };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Ionicons name="camera-off-outline" size={64} color="#6B8080" />
        <Text style={styles.permText}>Camera access needed to scan QR codes</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (result) {
    const isIn = result.action === 'check-in';
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.resultCard, { borderColor: isIn ? '#4CAF8A' : '#E05555' }]}>
          <Ionicons
            name={isIn ? 'log-in-outline' : 'log-out-outline'}
            size={64} color={isIn ? '#4CAF8A' : '#E05555'}
          />
          <Text style={styles.resultAction}>{isIn ? 'Checked In' : 'Checked Out'}</Text>
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultPlate}>{result.plateNumber}</Text>
          <Text style={styles.resultTime}>{result.time}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={reset}>
          <Ionicons name="scan-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Scan Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scan QR Code</Text>
      <Text style={styles.subtitle}>Point camera at vehicle's QR code</Text>
      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF8A" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>
      <Text style={styles.hint}>Hold steady — scans automatically</Text>
    </SafeAreaView>
  );
}

const C = 24;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C2B2B', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { color: '#E8F0EE', fontSize: 24, fontWeight: '800', alignSelf: 'flex-start' },
  subtitle: { color: '#6B8080', fontSize: 13, alignSelf: 'flex-start', marginBottom: 8 },
  cameraBox: { width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  corner: { position: 'absolute', width: C, height: C, borderColor: '#4CAF8A' },
  topLeft: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  topRight: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultCard: { width: '100%', backgroundColor: '#162222', borderRadius: 24, borderWidth: 2, padding: 32, alignItems: 'center', gap: 8 },
  resultAction: { fontSize: 22, fontWeight: '800', color: '#E8F0EE', marginTop: 8 },
  resultName: { fontSize: 18, fontWeight: '600', color: '#E8F0EE' },
  resultPlate: { fontSize: 14, color: '#4CAF8A', fontWeight: '700', letterSpacing: 2 },
  resultTime: { fontSize: 13, color: '#6B8080', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4CAF8A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  permText: { color: '#6B8080', textAlign: 'center', fontSize: 14, marginVertical: 16 },
  hint: { color: '#2E4040', fontSize: 12, textAlign: 'center' },
});

