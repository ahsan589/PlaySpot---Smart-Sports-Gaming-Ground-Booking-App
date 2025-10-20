import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Define a type for icon mappings
type IconMappings = {
  [key: string]: {
    active: string;
    inactive: string;
  };
};

// Default icon mappings
const defaultIconMappings: IconMappings = {
  dashboard: { active: 'home', inactive: 'home-outline' },
  grounds: { active: 'football', inactive: 'football-outline' },
  availability: { active: 'time', inactive: 'time-outline' },
  payment: { active: 'wallet', inactive: 'wallet-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
  bookingHistory: { active: 'calendar', inactive: 'calendar-outline' },
  complaints: { active: 'alert-circle', inactive: 'alert-circle-outline' },
};

export default function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const TAB_COUNT = state.routes.length;
  const TAB_WIDTH = width / TAB_COUNT;

  const [activeTab, setActiveTab] = useState(state.index);
  const animationValues = useRef(
    state.routes.map(() => ({
      scale: new Animated.Value(1),
      translateY: new Animated.Value(0),
    }))
  ).current;

  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const activeIndicatorX = useRef(new Animated.Value(activeTab * TAB_WIDTH)).current;

  useEffect(() => {
    // Animate active indicator
    Animated.spring(activeIndicatorX, {
      toValue: activeTab * TAB_WIDTH,
      useNativeDriver: true,
      tension: 70,
      friction: 7,
    }).start();

    // Bubble animation
    bubbleAnim.setValue(0);
    Animated.timing(bubbleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    // Animate icons
    state.routes.forEach((_, index: number) => {
      if (index === activeTab) {
        Animated.parallel([
          Animated.spring(animationValues[index].scale, {
            toValue: 1.2,
            useNativeDriver: true,
            tension: 150,
            friction: 5,
          }),
          Animated.spring(animationValues[index].translateY, {
            toValue: -8,
            useNativeDriver: true,
            tension: 120,
            friction: 7,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(animationValues[index].scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 5,
          }),
          Animated.spring(animationValues[index].translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 7,
          }),
        ]).start();
      }
    });
  }, [activeTab]);

  const handleTabPress = (route: any, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      setActiveTab(index);
      navigation.navigate(route.name);
    }
  };

  const bubbleInterpolate = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.8, 0],
  });

  const getIconName = (routeName: string, isActive: boolean): string => {
    const iconMapping =
      defaultIconMappings[routeName] || { active: 'help', inactive: 'help-outline' };
    return isActive ? iconMapping.active : iconMapping.inactive;
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background}>
        <View style={styles.gradientLayer} />
        <View style={[styles.gradientLayer, styles.gradientLayer2]} />
      </View>

      {/* Bubble effect */}
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: bubbleOpacity,
            transform: [
              {
                translateX: Animated.add(activeIndicatorX, TAB_WIDTH / 2 - 15),
              },
              { translateY: -25 },
              { scale: bubbleInterpolate },
            ],
          },
        ]}
      />

      {/* Tabs */}
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isActive = index === activeTab;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => handleTabPress(route, index)}
            activeOpacity={0.7}
          >
            {/* ICON */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ translateY: animationValues[index].translateY }],
                },
              ]}
            >
              <Ionicons
                name={getIconName(route.name, isActive) as any}
                size={20}
                color={isActive ? '#fff' : '#0f172a'}
              />

              {/* Animated Glow */}
              {isActive && (
                <Animated.View
                  style={[
                    styles.iconGlow,
                    {
                      opacity: animationValues[index].scale.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0, 1],
                      }),
                      transform: [{ scale: animationValues[index].scale }],
                    },
                  ]}
                />
              )}
            </Animated.View>

            {/* LABEL */}
            <Animated.Text
              style={[
                styles.label,
                {
                  opacity: animationValues[index].translateY.interpolate({
                    inputRange: [-8, 0],
                    outputRange: [1, 0.7],
                  }),
                  transform: [
                    {
                      translateY: animationValues[index].translateY.interpolate({
                        inputRange: [-8, 0],
                        outputRange: [0, 5],
                      }),
                    },
                  ],
                },
              ]}
            >
              {label as string}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'rgba(110, 63, 251, 0.3)',
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  gradientLayer2: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  bubble: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#1a294dff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 25,
    height: 25,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 10,
    backgroundColor: '#1a294dff',
    zIndex: -1,
  },
  label: {
    fontSize: 11,
    marginTop: -4,
    color: '#1a294dff',
    fontWeight: '500',
  },
});
