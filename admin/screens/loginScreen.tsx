import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import useToast from '../context/toast';


type Props = {
  onLogin: (user: { name: string; idNumber: string; token: string; role: string }) => void;
};

export default function LoginScreen({ onLogin }: Props) {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setToast = useToast((state) => state.setToast);
  
  const handleLogin = async () => {
    if (!idNumber.trim() || !password.trim()) {
      setToast('Please enter your staff ID and password', 'info');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/login`, {
        idNumber: idNumber.trim(),
        password,
      });
      onLogin({
        name: res.data.user.name,
        idNumber: res.data.user.idNumber,
        token: res.data.token,
        role: res.data.user.role || res.data.user.type || 'officer',
      });
    } catch (err: any) {
      setToast('Login Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={48} color="#4CAF8A" />
          </View>
          <Text style={styles.title}>Gate Officer</Text>
          <Text style={styles.subtitle}>Sign in to access the gate system</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Staff ID</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="card-outline" size={18} color="#4A6060" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. STF-00231"
                placeholderTextColor="#4A6060"
                value={idNumber}
                onChangeText={setIdNumber}
                autoCapitalize="characters"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#4A6060" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#4A6060"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20} color="#4A6060"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}>Sign In</Text>
                </View>
              )
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C2B2B' },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 40, gap: 8 },
  logoBox: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: '#162222', borderWidth: 1, borderColor: '#2E4040',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#E8F0EE' },
  subtitle: { fontSize: 14, color: '#6B8080', textAlign: 'center' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { color: '#A0B8B0', fontSize: 13, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#162222', borderRadius: 14,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#2E4040',
  },
  input: { flex: 1, color: '#E8F0EE', fontSize: 15, paddingVertical: 14 },
  btn: {
    backgroundColor: '#4CAF8A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

