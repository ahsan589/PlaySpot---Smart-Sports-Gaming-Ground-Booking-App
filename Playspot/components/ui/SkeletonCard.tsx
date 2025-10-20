import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { SkeletonText } from './SkeletonText';

interface SkeletonCardProps {
  style?: any;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, style, animatedStyle]}>
      <SkeletonText width="60%" height={20} style={styles.title} />
      <SkeletonText width="80%" height={16} style={styles.subtitle} />
      <SkeletonText width="40%" height={16} style={styles.price} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 8,
  },
  price: {
    marginBottom: 0,
  },
});
