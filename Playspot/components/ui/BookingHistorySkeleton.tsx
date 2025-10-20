import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

export const BookingHistorySkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Filter Tabs Skeleton */}
      <View style={styles.filterContainer}>
        <View style={styles.filterScrollContent}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.filterTab}>
              <View style={styles.filterContent}>
                <View style={styles.filterIconContainer}>
                  <SkeletonText width={16} height={16} style={styles.filterIconSkeleton} />
                </View>
                <View style={styles.filterTextContainer}>
                  <SkeletonText width={40} height={14} style={styles.filterTabText} />
                </View>
                <View style={styles.filterBadge}>
                  <SkeletonText width={20} height={12} style={styles.filterBadgeText} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Results Header Skeleton */}
      <View style={styles.resultsHeader}>
        <SkeletonText width={120} height={18} style={styles.resultsTitle} />
        <SkeletonText width={60} height={14} style={styles.resultsCount} />
      </View>

      {/* Booking Cards Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.bookingCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.groundInfo}>
              <SkeletonText width="60%" height={18} style={styles.groundName} />
              <SkeletonText width={80} height={20} style={styles.bookingAmount} />
            </View>
            <View style={styles.statusIcons}>
              <View style={styles.statusIcon}>
                <SkeletonText width={16} height={16} style={styles.statusIconSkeleton} />
              </View>
              <View style={styles.statusIcon}>
                <SkeletonText width={16} height={16} style={styles.statusIconSkeleton} />
              </View>
            </View>
          </View>

          {/* Booking Details */}

          {/* Status Container */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <SkeletonText width={50} height={12} style={styles.statusLabel} />
              <View style={styles.statusBadge}>
                <SkeletonText width={60} height={13} style={styles.statusText} />
              </View>
            </View>

            <View style={styles.statusItem}>
              <SkeletonText width={50} height={12} style={styles.statusLabel} />
              <View style={styles.statusBadge}>
                <SkeletonText width={70} height={13} style={styles.statusText} />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <View style={styles.actionButton}>
              <SkeletonText width={18} height={18} style={styles.actionIcon} />
              <SkeletonText width={60} height={15} style={styles.actionText} />
            </View>

            <View style={styles.actionButton}>
              <SkeletonText width={18} height={18} style={styles.actionIcon} />
              <SkeletonText width={80} height={15} style={styles.actionText} />
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
    backgroundColor: '#F9FAFB',
  },

  // Filter Tabs
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  filterIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterIconSkeleton: {},
  filterTextContainer: {
    flex: 1,
  },
  filterTabText: {},
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    backgroundColor: '#F3F4F6',
  },
  filterBadgeText: {
    textAlign: 'center',
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F3F4F6',
  },
  resultsTitle: {},
  resultsCount: {},

  // Booking Card
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 19,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 6,
    borderLeftColor: '#1a237e',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groundInfo: {
    flex: 1,
  },
  groundName: {
    marginBottom: 4,
  },
  bookingAmount: {},
  statusIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  statusIconSkeleton: {},

  // Booking Details
 
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {},
  detailText: {},

  // Status Container
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'flex-start',
  },
  statusLabel: {
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  statusText: {},

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  actionIcon: {},
  actionText: {},
});
