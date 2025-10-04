import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_REQUESTED_KEY = '@review_requested';
const TOTAL_GAMES_PLAYED_KEY = '@total_games_played';
const GAMES_THRESHOLD = 10; // 10게임 플레이 후 리뷰 요청

/**
 * 게임 플레이 카운트를 증가시킵니다
 */
export const incrementGameCount = async (): Promise<void> => {
  try {
    const currentCount = await getTotalGamesPlayed();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(TOTAL_GAMES_PLAYED_KEY, newCount.toString());

    // 10게임 플레이 시 자동으로 리뷰 요청
    if (newCount === GAMES_THRESHOLD) {
      await requestReviewIfEligible();
    }
  } catch (error) {
    console.error('Failed to increment game count:', error);
  }
};

/**
 * 총 플레이한 게임 수를 가져옵니다
 */
export const getTotalGamesPlayed = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(TOTAL_GAMES_PLAYED_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Failed to get total games played:', error);
    return 0;
  }
};

/**
 * 리뷰 요청 조건을 확인하고 가능하면 요청합니다
 */
export const requestReviewIfEligible = async (): Promise<boolean> => {
  try {
    // 이미 리뷰를 요청했는지 확인
    const hasRequested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
    if (hasRequested === 'true') {
      return false;
    }

    // 리뷰 기능이 사용 가능한지 확인
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }

    // 리뷰 요청
    await StoreReview.requestReview();

    // 리뷰 요청 완료 플래그 설정
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, 'true');

    return true;
  } catch (error) {
    console.error('Failed to request review:', error);
    return false;
  }
};

/**
 * 수동으로 리뷰 요청 (설정 화면 등에서 사용)
 */
export const requestReviewManually = async (): Promise<boolean> => {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      // 스토어로 직접 이동
      const storeUrl = await StoreReview.storeUrl();
      if (storeUrl) {
        // 여기서 Linking.openURL(storeUrl)을 호출할 수 있습니다
        console.log('Store URL:', storeUrl);
      }
      return false;
    }

    await StoreReview.requestReview();
    return true;
  } catch (error) {
    console.error('Failed to request review manually:', error);
    return false;
  }
};

/**
 * 리뷰 요청 상태를 초기화합니다 (테스트용)
 */
export const resetReviewStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([REVIEW_REQUESTED_KEY, TOTAL_GAMES_PLAYED_KEY]);
  } catch (error) {
    console.error('Failed to reset review status:', error);
  }
};
