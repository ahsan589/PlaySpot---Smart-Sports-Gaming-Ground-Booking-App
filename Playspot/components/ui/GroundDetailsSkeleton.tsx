import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const GroundDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Image Carousel Skeleton */}
      <View style={styles.imageContainer}>
        <Animated.View
          entering={FadeIn.duration(1000)}
          style={styles.coverImageSkeleton}
        />
        <View style={styles.paginationSkeleton}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.dotSkeleton} />
          ))}
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.titleSkeleton} />
          <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.ratingSkeleton} />
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          {[1, 2, 3, 4].map((item) => (
            <Animated.View
              key={item}
              entering={FadeIn.delay(400 + item * 100).duration(800)}
              style={styles.infoRowSkeleton}
            >
              <View style={styles.iconSkeleton} />
              <View style={styles.textSkeleton} />
            </Animated.View>
          ))}
        </View>

        {/* Availability Section */}
        <Animated.View entering={FadeIn.delay(800).duration(800)} style={styles.section}>
          <View style={styles.sectionHeaderSkeleton}>
            <View style={styles.iconSkeleton} />
            <View style={styles.sectionTitleSkeleton} />
          </View>
          <View style={styles.availabilitySkeleton}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.availabilityRowSkeleton} />
            ))}
          </View>
        </Animated.View>

        {/* Description Section */}
        <Animated.View entering={FadeIn.delay(1000).duration(800)} style={styles.section}>
          <View style={styles.sectionHeaderSkeleton}>
            <View style={styles.iconSkeleton} />
            <View style={styles.sectionTitleSkeleton} />
          </View>
          <View style={styles.descriptionSkeleton} />
        </Animated.View>

        {/* Size Section */}
        <Animated.View entering={FadeIn.delay(1100).duration(800)} style={styles.section}>
          <View style={styles.sectionHeaderSkeleton}>
            <View style={styles.iconSkeleton} />
            <View style={styles.sectionTitleSkeleton} />
          </View>
          <Animated.View entering={FadeIn.duration(600)} style={styles.sizeSkeleton} />
        </Animated.View>

        {/* Rating Section */}
        <Animated.View entering={FadeIn.delay(1200).duration(800)} style={styles.section}>
          <View style={styles.sectionHeaderSkeleton}>
            <View style={styles.iconSkeleton} />
            <View style={styles.sectionTitleSkeleton} />
          </View>
          <View style={styles.ratingContainerSkeleton}>
            <View style={styles.starsSkeleton} />
            <View style={styles.ratingTextSkeleton} />
            <View style={styles.buttonSkeleton} />
          </View>
        </Animated.View>

        {/* Amenities Section */}
        <Animated.View entering={FadeIn.delay(1300).duration(800)} style={styles.section}>
          <View style={styles.sectionHeaderSkeleton}>
            <View style={styles.iconSkeleton} />
            <View style={styles.sectionTitleSkeleton} />
          </View>
          <View style={styles.amenitiesSkeleton}>
            {[1, 2, 3, 4].map((item) => (
              <Animated.View
                key={item}
                entering={FadeIn.duration(600)}
                style={styles.amenitySkeleton}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 320,
    width: '100%',
    position: 'relative',
  },
  coverImageSkeleton: {
    width: '100%',
    height: 320,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  paginationSkeleton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dotSkeleton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSkeleton: {
    width: '70%',
    height: 28,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  ratingSkeleton: {
    width: 60,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconSkeleton: {
    width: 20,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginRight: 8,
  },
  textSkeleton: {
    flex: 1,
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleSkeleton: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginLeft: 8,
  },
  availabilitySkeleton: {
    marginTop: 8,
  },
  availabilityRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    height: 20,
  },
  descriptionSkeleton: {
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  sizeSkeleton: {
    width: 100,
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ratingContainerSkeleton: {
    alignItems: 'center',
  },
  starsSkeleton: {
    flexDirection: 'row',
    marginBottom: 8,
    width: 120,
    height: 24,
  },
  ratingTextSkeleton: {
    height: 16,
    width: 150,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  buttonSkeleton: {
    width: 120,
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  amenitiesSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenitySkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    width: 80,
    height: 24,
  },
});

export default GroundDetailsSkeleton;
