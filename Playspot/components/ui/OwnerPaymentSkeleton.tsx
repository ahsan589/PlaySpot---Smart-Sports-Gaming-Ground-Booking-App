import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

export const OwnerPaymentSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header} />

      {/* Welcome Card Skeleton */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <View style={styles.avatarContainer}>
            <SkeletonText width={56} height={56} style={styles.avatar} />
          </View>
          <View style={styles.welcomeText}>
            <SkeletonText width={150} height={20} style={styles.welcomeTitle} />
            <SkeletonText width={120} height={16} style={styles.welcomeSubtitle} />
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <SkeletonText width={40} height={24} />
            <SkeletonText width={80} height={12} />
          </View>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.section}>
        <SkeletonText width={200} height={20} style={styles.sectionTitle} />
        <SkeletonText width={150} height={14} style={styles.sectionSubtitle} />
      </View>

      {/* Methods Grid Skeleton */}
      <View style={styles.methodsGrid}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.methodCard}>
            <View style={styles.methodCardHeader}>
              <SkeletonText width={40} height={40} style={styles.methodIcon} />
              <View style={styles.switchContainer}>
                <SkeletonText width={50} height={30} />
              </View>
            </View>
            <SkeletonText width={120} height={18} />
            <SkeletonText width={80} height={14} />
            <View style={styles.methodFooter}>
              <SkeletonText width={100} height={14} />
              <SkeletonText width={16} height={16} />
            </View>
          </View>
        ))}
      </View>

      {/* Active Methods Section */}
      <View style={styles.section}>
        <SkeletonText width={180} height={20} style={styles.sectionTitle} />
        <SkeletonText width={140} height={14} style={styles.sectionSubtitle} />
      </View>

      {/* Empty State or Active Methods Skeleton */}
      <View style={styles.emptyState}>
        <SkeletonText width={48} height={48} style={styles.emptyIcon} />
        <SkeletonText width={160} height={18} style={styles.emptyTitle} />
        <SkeletonText width={200} height={14} style={styles.emptySubtitle} />
        <SkeletonText width={140} height={40} style={styles.addButton} />
      </View>

      {/* Active Method Card Skeleton (if any) */}
      <View style={styles.activeMethodCard}>
        <View style={styles.activeMethodHeader}>
          <View style={styles.methodInfo}>
            <SkeletonText width={32} height={32} style={styles.activeMethodIcon} />
            <View>
              <SkeletonText width={100} height={16} />
              <SkeletonText width={120} height={12} />
            </View>
          </View>
          <SkeletonText width={32} height={32} />
        </View>
        <View style={styles.detailsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.detailItem}>
              <SkeletonText width={14} height={14} />
              <SkeletonText width={60} height={12} />
              <SkeletonText width={100} height={14} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  header: {
    height: 100,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    borderRadius: 28,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    marginBottom: 4,
  },
  welcomeSubtitle: {},
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionSubtitle: {},
  methodsGrid: {
    flexDirection: 'column',
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  methodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    borderRadius: 12,
  },
  switchContainer: {},
  methodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emptyIcon: {
    borderRadius: 24,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    alignSelf: 'center',
  },
  emptySubtitle: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  addButton: {
    borderRadius: 12,
    alignSelf: 'center',
  },
  activeMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  activeMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeMethodIcon: {
    borderRadius: 8,
    marginRight: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
    flexDirection: 'column',
  },
});

export default OwnerPaymentSkeleton;
