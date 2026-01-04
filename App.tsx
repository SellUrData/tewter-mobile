import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { XPProvider } from './src/contexts/XPContext';
import { LeagueProvider } from './src/contexts/LeagueContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NetworkProvider>
          <AuthProvider>
            <SettingsProvider>
              <ProgressProvider>
                <XPProvider>
                  <LeagueProvider>
                    <StatusBar style="light" />
                    <View style={{ flex: 1 }}>
                      <OfflineBanner />
                      <AppNavigator />
                    </View>
                  </LeagueProvider>
                </XPProvider>
              </ProgressProvider>
            </SettingsProvider>
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
