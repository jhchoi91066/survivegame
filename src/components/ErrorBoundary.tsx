import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // 부모 컴포넌트의 onReset 콜백 호출
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f172a']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>😅</Text>
            <Text style={styles.errorTitle}>앗, 문제가 발생했어요</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || '일시적인 오류가 발생했습니다'}
            </Text>
            <Text style={styles.errorHint}>
              다시 시도하거나, 문제가 계속되면 앱을 재시작해주세요.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={this.handleReset}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>🔄 다시 시도</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  errorHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default ErrorBoundary;