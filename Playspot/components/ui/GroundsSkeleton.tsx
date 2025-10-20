import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

export const GroundsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Custom Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.textContainer}>
            <SkeletonText width={200} height={28} style={styles.title} />
            <SkeletonText width={180} height={14} style={styles.subtitle} />
          </View>
          <View style={styles.userContainer}>
            <SkeletonText width={80} height={10} style={styles.welcome} />
            <SkeletonText width={60} height={12} style={styles.userName} />
            <View style={styles.avatar}>
              <SkeletonText width={32} height={32} style={styles.avatarSkeleton} />
            </View>
          </View>
        </View>
      </View>

      {/* Search Bar Skeleton */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SkeletonText width={20} height={20} style={styles.searchIcon} />
          <SkeletonText width="70%" height={16} style={styles.searchInput} />
        </View>
        <View style={styles.filterButton}>
          <SkeletonText width={20} height={20} style={styles.filterIcon} />
        </View>
      </View>

      {/* Results Count Skeleton */}
      <View style={styles.resultsContainer}>
        <SkeletonText width={120} height={16} style={styles.resultsText} />
        <SkeletonText width={80} height={14} style={styles.viewToggle} />
      </View>

      {/* Ground Cards Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.groundCard}>
          {/* Image Section */}
          <View style={styles.cardImageSection}>
            <SkeletonText width="100%" height={160} style={styles.cardImage} />
            <View style={styles.statusBadge}>
              <SkeletonText width={40} height={10} style={styles.statusText} />
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.cardContent}>
            {/* Rating and Reviews */}
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <SkeletonText key={star} width={16} height={16} style={styles.star} />
                ))}
              </View>
              <View style={styles.ratingInfo}>
                <SkeletonText width={30} height={12} style={styles.ratingText} />
                <SkeletonText width={25} height={10} style={styles.reviewsCount} />
              </View>
            </View>

            {/* Name and Price */}
            <View style={styles.namePriceRow}>
              <SkeletonText width="60%" height={16} style={styles.groundName} />
              <SkeletonText width={60} height={14} style={styles.groundPrice} />
            </View>

            {/* Location */}
            <View style={styles.locationSection}>
              <SkeletonText width={14} height={14} style={styles.locationIcon} />
              <SkeletonText width="40%" height={12} style={styles.groundAddress} />
            </View>

            {/* Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <SkeletonText width={14} height={14} style={styles.detailIcon} />
                <SkeletonText width={80} height={12} style={styles.detailText} />
              </View>
              <View style={styles.detailItem}>
                <SkeletonText width={14} height={14} style={styles.detailIcon} />
                <SkeletonText width={60} height={12} style={styles.detailText} />
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.amenitiesContainer}>
              <SkeletonText width={60} height={12} style={styles.amenityChip} />
              <SkeletonText width={70} height={12} style={styles.amenityChip} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Header Skeleton
  header: {
    backgroundColor: '#ffffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fcfcfcff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {},
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a227e8e',
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  welcome: {},
  userName: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSkeleton: {
    borderRadius: 16,
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {},
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {},

  // Results Container
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  resultsText: {},
  viewToggle: {},

  // Ground Card
  groundCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
    flexDirection: 'row',
    height: 160,
  },
  cardImageSection: {
    width: '35%',
    minWidth: 100,
    maxWidth: 120,
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    borderRadius: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0a0b0a71',
  },
  statusText: {},
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  ratingText: {
    marginRight: 4,
  },
  reviewsCount: {},
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  groundName: {},
  groundPrice: {},
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationIcon: {
    marginRight: 6,
  },
  groundAddress: {},
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {},
  amenitiesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  amenityChip: {
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
});
