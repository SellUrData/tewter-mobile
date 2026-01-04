import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiSlash } from 'phosphor-react-native';
import { colors, spacing, fontSize } from '../constants/theme';
import { useNetwork } from '../contexts/NetworkContext';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();
  
  // Show banner if not connected or internet not reachable
  const isOffline = !isConnected || isInternetReachable === false;
  
  if (!isOffline) return null;
  
  return (
    <View style={styles.container}>
      <WifiSlash size={18} color={colors.white} weight="bold" />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
