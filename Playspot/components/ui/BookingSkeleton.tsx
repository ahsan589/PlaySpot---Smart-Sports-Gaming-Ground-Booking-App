import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

export const BookingSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonText width={24} height={24} style={styles.backButton} />
        <SkeletonText width={150} height={22} style={styles.title} />
      </View>

      {/* User Info Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <SkeletonText width={24} height={24} style={styles.icon} />
          <View style={styles.userDetails}>
            <SkeletonText width={120} height={16} />
            <SkeletonText width={150} height={14} />
          </View>
        </View>
      </View>

      {/* Ground Info Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.groundInfo}>
          <SkeletonText width={24} height={24} style={styles.icon} />
          <View style={styles.groundDetails}>
            <SkeletonText width={140} height={18} />
            <SkeletonText width={80} height={16} />
          </View>
        </View>
      </View>

      {/* Date Selection Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonText width={20} height={20} style={styles.icon} />
          <SkeletonText width={100} height={18} />
        </View>
        <View style={styles.datesContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.dateOption}>
              <SkeletonText width={40} height={14} />
              <SkeletonText width={30} height={20} />
              <SkeletonText width={35} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Duration Selection Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonText width={20} height={20} style={styles.icon} />
          <SkeletonText width={120} height={18} />
        </View>
        <View style={styles.durationContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonText key={i} width={60} height={30} style={styles.durationOption} />
          ))}
        </View>
      </View>

      {/* Time Selection Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonText width={20} height={20} style={styles.icon} />
          <SkeletonText width={140} height={18} />
        </View>
        <View style={styles.timesContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.timeOption}>
              <SkeletonText width={20} height={20} style={styles.icon} />
              <SkeletonText width={80} height={20} />
            </View>
          ))}
        </View>
      </View>

      {/* Summary Card Skeleton */}
      <View style={styles.card}>
        <SkeletonText width={120} height={18} style={styles.summaryTitle} />
        <View style={styles.summaryDetails}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.summaryItem}>
              <SkeletonText width={16} height={16} style={styles.icon} />
              <SkeletonText width={100} height={16} />
            </View>
          ))}
        </View>
      </View>

      {/* Book Button Skeleton */}
      <SkeletonText width="100%" height={50} style={styles.confirmButton} />

      {/* Info Container Skeleton */}
      <View style={styles.infoContainer}>
        <SkeletonText width={20} height={20} style={styles.icon} />
        <SkeletonText width="90%" height={14} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
  },
  groundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groundDetails: {
    marginLeft: 15,
  },
  icon: {
    marginRight: 8,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateOption: {
    width: 80,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  durationOption: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    margin: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    margin: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    marginBottom: 15,
  },
  summaryDetails: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#1a237e',
    margin: 16,
    borderRadius: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
});
