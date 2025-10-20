import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorValue,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get("window");

// ---------------- SLIDES ----------------
type Slide = {
  id: number;
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
  highlight: string;
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
};

const slides: Slide[] = [
  {
    id: 1,
    image: require("../assets/images/back.jpg"),
    title: "Welcome to",
    subtitle: "Add your ground or play near your location with advanced booking system",
    highlight: "Indoor Games",
    gradient: ["#0f172a", "#121c32ff", "#152752ff"] as const,
  },
  {
    id: 2,
    image: require("../assets/images/game.png"),
    title: "Join the",
    subtitle: "Compete with friends in real-time arenas with live scoring",
    highlight: "Gaming Arena",
    gradient: ["#0f172a", "#121c32ff", "#152752ff"] as const,
  },
  {
    id: 3,
    image: require("../assets/images/ind.png"),
    title: "Explore",
    subtitle: "Find and book premium outdoor grounds with verified reviews",
    highlight: "Outdoor Ground",
    gradient: ["#0f172a", "#121c32ff", "#152752ff"] as const,
  },
];

// ---------------- FLOATING ICONS ----------------
const sportsIcons = [
  "basketball",
  "tennisball",
  "football",
  "baseball",
  "american-football",
] as const;

const FloatingIcon = ({ 
  iconName, 
  index, 
  containerHeight, 
  currentIndex 
}: {
  iconName: string;
  index: number;
  containerHeight: number;
  currentIndex: number;
}) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(containerHeight + Math.random() * 100);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(Math.random() * 360);

  useEffect(() => {
    const delay = index * 400;

    setTimeout(() => {
      scale.value = withSpring(0.8 + Math.random() * 0.4, {
        damping: 10,
        stiffness: 120
      });
      opacity.value = withTiming(0.6 + Math.random() * 0.3, { duration: 1500 });

      rotation.value = withRepeat(
        withTiming(rotation.value + 180, { duration: 8000 + Math.random() * 4000 }),
        -1,
        true
      );

      // Horizontal floating animation
      x.value = withRepeat(
        withSequence(
          withTiming(x.value + Math.random() * 120 - 60, {
            duration: 5000 + Math.random() * 3000
          }),
          withTiming(x.value - Math.random() * 120 + 60, {
            duration: 5000 + Math.random() * 3000
          })
        ),
        -1,
        true
      );

      // Vertical floating animation (limited to bottom section)
      y.value = withRepeat(
        withSequence(
          withTiming(y.value - Math.random() * 80, {
            duration: 4000 + Math.random() * 2000
          }),
          withTiming(y.value + Math.random() * 80, {
            duration: 4000 + Math.random() * 2000
          })
        ),
        -1,
        true
      );
    }, delay);
  }, [containerHeight, currentIndex]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  return (
    <Animated.View style={[styles.floatingIcon, iconStyle]} pointerEvents="none">
      <Ionicons
        name={iconName as any}
        size={20 + Math.random() * 12}
        color={`rgba(255, 255, 255, ${0.4 + Math.random() * 0.3})`}
      />
    </Animated.View>
  );
};

// ---------------- LOADING ANIMATION ----------------
const LoadingAnimation = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="football" size={50} color="#fff" />
    </Animated.View>
  );
};

// ---------------- SLIDE ITEM ----------------
function SlideItem({
  item,
  index,
  currentIndex,
  onNext,
  onSkip,
}: {
  item: Slide;
  index: number;
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
      </View>

      {/* Skip Button */}
      {index === currentIndex && (
        <View style={styles.skipButtonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image with Enhanced Styling */}
      <View style={styles.imageContainer}>
        <Image 
          source={item.image} 
          style={styles.image}
        />
        {/* Image Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
          style={styles.imageOverlay}
        />
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Bottom Gradient - Fixed colors prop */}
        <LinearGradient
          colors={item.gradient}
          style={styles.bottomContainer}
        >
          {/* Decorative Elements */}
          <View style={styles.decorativeLine} />
          
          {/* Title */}
          <Text style={styles.title}>
            {item.title} <Text style={styles.highlight}>{item.highlight}</Text>
          </Text>

          {/* Subtitle */}
          <Text
            style={styles.subtitle}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {item.subtitle}
          </Text>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {slides.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[
                  styles.progressDot,
                  currentIndex === dotIndex ? styles.progressDotActive : styles.progressDotInactive,
                ]}
              />
            ))}
          </View>

          {/* Button */}
          <View style={styles.navWrapper}>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={onNext}
              activeOpacity={0.8}
            >
              {/* Fixed button gradient colors */}
              <LinearGradient
                colors={['#1e293b', '#4f46e5'] as const}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.playText}>
                    {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
                  </Text>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </View>
                
                {/* Button Shine Effect */}
                <View style={styles.buttonShine} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

// ---------------- MAIN ONBOARDING ----------------
export default function Onboarding() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO CONDITIONAL HOOKS
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const router = useRouter();
  const bottomContainerHeight = height * 0.4;
  
  // useAuth hook MUST be called unconditionally at the top level
  const { user, role, loading } = useAuth();

  // Auth redirection effect
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'owner') {
        router.replace('/Owner/(tabs)/dashboard');
      } else if (role === 'player') {
        router.replace('/Player/(tabs)/grounds');
      }
    }
  }, [user, role, loading, router]);

  // Floating icons only in bottom section
  const floatingIcons = useMemo(
    () =>
      Array(15)
        .fill(0)
        .map((_, i) => ({
          iconName: sportsIcons[i % sportsIcons.length],
          id: i,
        })),
    []
  );

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ 
        index: currentIndex + 1,
        animated: true 
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    router.push("/login");
  };

  // Show loading screen while checking auth - THIS IS CONDITIONAL RENDERING, NOT CONDITIONAL HOOKS
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
      </View>
    );
  }

  // If user is already authenticated, don't show onboarding
  if (user && role) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Onboarding slides */}
      <FlatList
        data={slides}
        renderItem={({ item, index }) => (
          <SlideItem
            item={item}
            index={index}
            currentIndex={currentIndex}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        ref={flatListRef}
        bounces={false}
        scrollEventThrottle={16}
      />

      {/* Floating Icons Container (Bottom Section Only) */}
      <View 
        style={[
          styles.floatingIconsContainer, 
          { top: height * 0.6, height: bottomContainerHeight }
        ]} 
        pointerEvents="none"
      >
        {floatingIcons.map((icon, index) => (
          <FloatingIcon
            key={icon.id}
            iconName={icon.iconName}
            index={index}
            containerHeight={bottomContainerHeight}
            currentIndex={currentIndex}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: '#0f172a'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width,
    flex: 1,
    backgroundColor: "#0f172a",
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  patternCircle1: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: '30%',
    left: '5%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  patternCircle3: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 25,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  imageContainer: {
    flex: 0.6,
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  contentContainer: {
    flex: 0.4,
    zIndex: 3,
  },
  bottomContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: "space-between",
  },
  decorativeLine: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  highlight: {
    color: "#4f46e5",
    fontWeight: "900",
    textShadowColor: 'rgba(135, 79, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#E3F2FD",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  progressDotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  navWrapper: {
    alignItems: "center",
  },
  playButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 3,
    width: '80%',
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  playText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  buttonShine: {
    position: 'absolute',
    top: -10,
    left: -50,
    width: 30,
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '25deg' }],
  },
  floatingIcon: {
    position: "absolute",
    zIndex: 1,
  },
  floatingIconsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'hidden',
  },
});