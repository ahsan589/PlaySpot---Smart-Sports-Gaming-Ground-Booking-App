import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ImageCarouselProps {
  photos: string[];
  groundName: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ photos, groundName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.noImageContainer}>
        <Ionicons name="location-outline" size={40} color="#ccc" />
        <Text style={styles.noImageText}>No Image</Text>
      </View>
    );
  }

  // Get different images for each position
  const getMainImage = () => {
    // Show the first image as main (no number overlay)
    return photos[0];
  };

  const getBottomLeftImage = () => {
    // Show the second image if available, otherwise fallback to first
    return photos[1] || photos[0];
  };

  const getBottomRightImage = () => {
    // Show the first image for total count indicator
    return photos[0];
  };

  const getTotalImagesDisplay = () => {
    // Show total count of images
    return photos.length;
  };

  return (
    <View style={styles.imageCarouselContainer}>
      {/* Main large image - shows first image (NO number overlay) */}
      <View style={styles.mainImageContainer}>
        <Image
          source={{ uri: getMainImage() }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </View>

      {/* Bottom section with two smaller images */}
      {photos.length > 1 && (
        <View style={styles.bottomImagesContainer}>
          {/* Left: Different image without number overlay */}
          <View style={styles.bottomImageWrapper}>
            <Image
              source={{ uri: getBottomLeftImage() }}
              style={styles.bottomImage}
              resizeMode="cover"
            />
          </View>

          {/* Right: Total images count indicator */}
          <View style={styles.bottomImageWrapper}>
            <Image
              source={{ uri: getBottomRightImage() }}
              style={styles.bottomImage}
              resizeMode="cover"
            />
            <View style={styles.totalImagesOverlay}>
              <Text style={styles.totalImagesText}>{getTotalImagesDisplay()}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Hidden FlatList for swipe functionality */}
      <FlatList
        ref={flatListRef}
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={() => null}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width * 0.9);
          setActiveIndex(index);
        }}
        style={styles.hiddenFlatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imageCarouselContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mainImageContainer: {
    flex: 1,
    width: '100%',
    height: '50%',
    position: 'relative',
    marginBottom: 4,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  bottomImagesContainer: {
    flexDirection: 'row',
    height: '30%',
    width: '100%',
    marginBottom: 24,
    gap: 2,
  },
  bottomImageWrapper: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
  totalImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalImagesText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hiddenFlatList: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
