import { View, Text, StyleSheet, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useToast from '../context/toast'

export default function Toast() {
  const { message, type, visible } = useToast()

  const config = {
    success: { color: '#4CAF8A', icon: 'checkmark-circle' as const },
    error:   { color: '#E05555', icon: 'close-circle' as const },
    info:    { color: '#6C63FF', icon: 'information-circle' as const },
  }[type]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.wrapper}>
        <View style={[styles.toast, { borderLeftColor: config.color }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
    paddingHorizontal: 16,
    pointerEvents: 'none',
  },
  toast: {
    backgroundColor: '#162222',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 4,
    elevation: 10,
  },
  message: { color: '#E8F0EE', fontSize: 14, fontWeight: '600', flex: 1 },
})