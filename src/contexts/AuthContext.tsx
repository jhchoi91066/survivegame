import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';

// Web browser 설정 (웹 플랫폼용)
WebBrowser.maybeCompleteAuthSession();

// Google Sign-In 설정
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 웹에서 OAuth 리다이렉트 처리
    if (Platform.OS === 'web') {
      // URL에서 에러 체크
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const error = searchParams.get('error') || hashParams.get('error');
      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

      if (error) {
        console.error('OAuth 에러:', error, errorDescription);
        // URL 정리
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // URL에서 OAuth 토큰 파싱 시도
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('OAuth 리다이렉트 감지, 세션 설정 중...');
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data, error }) => {
          if (error) {
            console.error('세션 설정 오류:', error);
          } else {
            console.log('세션 설정 성공:', data.user?.email);
            // URL에서 토큰 제거
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
      }
    }

    // 초기 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('초기 세션:', session?.user?.email || 'null');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 세션 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('인증 상태 변경:', event, session?.user?.email || 'null');
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        // 웹 플랫폼: OAuth 리다이렉트 사용
        const redirectUrl = `${window.location.origin}${window.location.pathname}`;
        console.log('Google OAuth 시작, redirectTo:', redirectUrl);

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });
        if (error) throw error;
      } else {
        // 모바일 플랫폼: Google Sign-In SDK 사용
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();

        // Check if idToken is available directly or nested in data (depending on version)
        const response = userInfo as any;
        const idToken = response.data?.idToken || response.idToken;

        if (idToken) {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          if (error) throw error;
        } else {
          throw new Error('No ID token present!');
        }
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Apple 로그인 오류:', error);
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (error) {
      console.error('익명 로그인 오류:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithApple,
        signInAnonymously,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
