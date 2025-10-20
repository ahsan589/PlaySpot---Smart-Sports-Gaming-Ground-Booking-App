import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const OwnerBookingsSkeleton = () => {
  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#1a191bff', '#232324ff']} 
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
          </View>
          <View style={styles.titleContainer}>
            <View style={styles.titleSkeleton} />
            <View style={styles.subtitleSkeleton} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.skeletonList}>
        {[...Array(5)].map((_, index) => (
          <View key={index} style={styles.skeletonCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleSkeletonSmall} />
              <View style={styles.statusSkeleton} />
            </View>
            
            <View style={styles.dividerSkeleton} />
            
            <View style={styles.infoSkeleton}>
              <View style={styles.infoRowSkeleton} />
              <View style={styles.infoRowSkeleton} />
              <View style={styles.infoRowSkeleton} />
              <View style={styles.infoRowSkeleton} />
            </View>
            
            <View style={styles.dividerSkeleton} />
            
            <View style={styles.detailsSkeleton}>
              <View style={styles.detailItemSkeleton} />
              <View style={styles.detailItemSkeleton} />
              <View style={styles.detailItemSkeleton} />
              <View style={styles.detailItemSkeleton} />
            </View>
            
            <View style={styles.actionsSkeleton}>
              <View style={styles.actionButtonSkeleton} />
              <View style={styles.actionButtonSkeleton} />
              <View style={styles.actionButtonSkeleton} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const SkeletonItem = () => (
  <LinearGradient
    colors={['#E5E7EB', '#F3F4F6']}
    style={styles.skeletonItem}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientHeader: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleSkeleton: {
    width: 120,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 4,
  },
  subtitleSkeleton: {
    width: 180,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skeletonList: {
    flex: 1,
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#313132ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSkeletonSmall: {
    width: 200,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
  },
  statusSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerSkeleton: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  infoSkeleton: {
    gap: 8,
    marginBottom: 12,
  },
  infoRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  infoTextSkeleton: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
  },
  detailsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItemSkeleton: {
    alignItems: 'center',
    minWidth: '22%',
  },
  detailLabelSkeleton: {
    width: 40,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  detailValueSkeleton: {
    width: 30,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
  },
  actionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButtonSkeleton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonItem: {
    borderRadius: 8,
  },
});

export { OwnerBookingsSkeleton };

