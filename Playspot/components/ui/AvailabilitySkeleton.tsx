import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

export const AvailabilitySkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <SkeletonText width={40} height={40} style={styles.headerIcon} />
          <View style={styles.headerText}>
            <SkeletonText width={120} height={24} style={styles.headerTitle} />
            <SkeletonText width={180} height={16} style={styles.headerSubtitle} />
          </View>
        </View>
      </View>

      {/* Ground Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.groundCard}>
          {/* Ground Name */}
          <SkeletonText width={150} height={20} style={styles.groundName} />

          {/* Days */}
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <View key={day} style={styles.dayContainer}>
              <SkeletonText width={80} height={16} style={styles.dayText} />
              <View style={styles.slotsContainer}>
                {[1, 2, 3].map((slot) => (
                  <SkeletonText key={slot} width={80} height={24} style={styles.slot} />
                ))}
                <View style={styles.addSlot}>
                  <SkeletonText width={20} height={20} style={styles.addIcon} />
                  <SkeletonText width={60} height={14} style={styles.addText} />
                </View>
              </View>
            </View>
          ))}

          {/* Save Button */}
          <SkeletonText width="100%" height={44} style={styles.saveButton} />
        </View>
      ))}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    width: 120,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    width: 180,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  groundCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6c6d7aff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groundName: {
    width: 150,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 12,
  },
  dayContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayText: {
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  slot: {
    width: 80,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  addSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  addIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginRight: 4,
  },
  addText: {
    width: 60,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 7,
  },
  saveButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
});

export default AvailabilitySkeleton;
