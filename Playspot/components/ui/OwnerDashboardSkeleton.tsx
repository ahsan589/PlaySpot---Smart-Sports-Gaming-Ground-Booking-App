import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const OwnerDashboardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#44444fff', '#dad2e7ff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon} />
          <View style={styles.headerText}>
            <View style={styles.headerTitle} />
            <View style={styles.headerSubtitle} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Performance Overview Cards */}
        <View style={styles.section}>
          <View style={styles.sectionTitle} />
          <View style={styles.performanceGrid}>
            {[...Array(4)].map((_, index) => (
              <View key={index} style={styles.performanceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.icon} />
                  <View style={styles.dots} />
                </View>
                <View style={styles.value} />
                <View style={styles.label} />
                <View style={styles.trend}>
                  <View style={styles.trendIcon} />
                  <View style={styles.trendText} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTitle} />
          <View style={styles.quickActionsGrid}>
            {[...Array(4)].map((_, index) => (
              <View key={index} style={styles.quickActionCard}>
                <View style={styles.quickIcon} />
                <View style={styles.quickText} />
                <View style={styles.quickSubtext} />
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <View style={styles.sectionTitle} />
          {[...Array(2)].map((_, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon} />
                <View style={styles.insightTitle} />
              </View>
              <View style={styles.insightText} />
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle} />
            <View style={styles.viewAll} />
          </View>
          <View style={styles.activityCard}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon} />
                <View style={styles.activityContent}>
                  <View style={styles.activityTitle} />
                  <View style={styles.activityTime} />
                </View>
                <View style={styles.activityAmount} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    width: 150,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    width: 200,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    width: 180,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    width: 60,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  dots: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  value: {
    width: 100,
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    marginBottom: 4,
  },
  label: {
    width: 80,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 7,
    marginBottom: 8,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 4,
  },
  trendText: {
    width: 120,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
    alignSelf: 'center',
  },
  quickText: {
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 4,
    alignSelf: 'center',
  },
  quickSubtext: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    alignSelf: 'center',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  insightTitle: {
    width: 100,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  insightText: {
    width: '100%',
    height: 60,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    width: 150,
    height: 15,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 4,
  },
  activityTime: {
    width: 80,
    height: 13,
    backgroundColor: '#E5E7EB',
    borderRadius: 7,
  },
  activityAmount: {
    width: 60,
    height: 15,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
});

export { OwnerDashboardSkeleton };

