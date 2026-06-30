import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScanScreen from './screens/scanScreen';
import HistoryScreen from './screens/historyScreen';
import LoginScreen from './screens/loginScreen';
import VerifyScreen from './screens/verifyScreen';
import Toast from './components/toast';
import useToast from './context/toast';

export type AuthUser = {
  name: string;
  email: string;
  token: string;
  role: string;
};

export default function App() {
  const [screen, setScreen] = useState('scan');
  const [user, setUser] = useState<AuthUser | null>(null);
  const setToast = useToast((state) => state.setToast)

  if (!user) {
    return <LoginScreen onLogin={(userData) => setUser(userData)} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <View style={styles.container}>

      <Toast />

      {screen === 'scan' && <ScanScreen token={user.token} />}
      {screen === 'history' && <HistoryScreen token={user.token} />}
      {screen === 'verify' && <VerifyScreen token={user.token} />}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, screen === 'scan' && styles.activeTab]}
          onPress={() => setScreen('scan')}
        >
          <Ionicons name="qr-code-outline" size={24} color={screen === 'scan' ? '#4CAF8A' : '#6B8080'} />
          <Text style={[styles.tabText, screen === 'scan' && styles.activeTabText]}>Scan</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.tab, screen === 'verify' && styles.activeTab]}
            onPress={() => setScreen('verify')}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={screen === 'verify' ? '#4CAF8A' : '#6B8080'} />
            <Text style={[styles.tabText, screen === 'verify' && styles.activeTabText]}>Requests</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.tab, screen === 'history' && styles.activeTab]}
          onPress={() => setScreen('history')}
        >
          <Ionicons name="time-outline" size={24} color={screen === 'history' ? '#4CAF8A' : '#6B8080'} />
          <Text style={[styles.tabText, screen === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setUser(null)}
        >
          <Ionicons name="log-out-outline" size={24} color="#6B8080" />
          <Text style={styles.tabText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C2B2B' },
  tabs: {
    flexDirection: 'row', backgroundColor: '#162222',
    borderTopWidth: 1, borderTopColor: '#2E4040', paddingBottom: 24,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  activeTab: { borderTopWidth: 2, borderTopColor: '#4CAF8A' },
  tabText: { color: '#6B8080', fontSize: 11, fontWeight: '600' },
  activeTabText: { color: '#4CAF8A' },
});

