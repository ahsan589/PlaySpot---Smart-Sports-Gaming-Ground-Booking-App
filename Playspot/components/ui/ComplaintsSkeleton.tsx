import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

const { width, height } = Dimensions.get('window');
const isSmall = width < 400;
const isMedium = width >= 400 && width < 768;
const isLarge = width >= 768;

export const ComplaintsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Component Placeholder */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <SkeletonText width={24} height={24} style={styles.headerIcon} />
        </View>
        <View style={styles.headerTextContainer}>
          <SkeletonText width={180} height={20} style={styles.headerTitle} />
          <SkeletonText width={250} height={16} style={styles.headerSubtitle} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Tab Container */}
        <View style={styles.tabContainer}>
          <View style={[styles.tab, styles.activeTab]}>
            <SkeletonText width={20} height={20} style={styles.tabIcon} />
            <SkeletonText width={100} height={14} style={styles.tabText} />
            <View style={styles.badge}>
              <SkeletonText width={20} height={12} style={styles.badgeText} />
            </View>
          </View>

          <View style={styles.tab}>
            <SkeletonText width={20} height={20} style={styles.tabIcon} />
            <SkeletonText width={90} height={14} style={styles.tabText} />
            <View style={[styles.badge, styles.badgeWarning]}>
              <SkeletonText width={20} height={12} style={styles.badgeText} />
            </View>
          </View>
        </View>

        {/* New Complaint Button */}
        <View style={styles.newComplaintButton}>
          <SkeletonText width={20} height={20} style={styles.buttonIcon} />
          <SkeletonText width={140} height={16} style={styles.buttonText} />
        </View>

        {/* Complaint Cards */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.simpleComplaintCard, isLarge && styles.simpleComplaintCardTablet]}>
            <View style={styles.simpleCardHeader}>
              <View style={styles.simpleCardTitleContainer}>
                <View style={styles.iconContainer}>
                  <SkeletonText width={20} height={20} style={styles.iconPlaceholder} />
                </View>
                <View style={styles.simpleCardTextContainer}>
                  <SkeletonText width="60%" height={16} style={styles.simpleCardTitle} />
                  <SkeletonText width="40%" height={14} style={styles.simpleCardSubtitle} />
                </View>
              </View>
              <View style={styles.simpleStatusBadge}>
                <SkeletonText width={60} height={10} style={styles.simpleStatusText} />
              </View>
            </View>

            <View style={styles.simpleCardBody}>
              <SkeletonText width="100%" height={14} style={styles.simpleCardDescription} />
              <SkeletonText width="90%" height={14} style={styles.simpleCardDescription} />
              <SkeletonText width="70%" height={14} style={styles.simpleCardDescription} />
            </View>

            <View style={styles.simpleCardFooter}>
              <View style={styles.simpleCardDateTime}>
                <SkeletonText width={14} height={14} style={styles.dateIcon} />
                <SkeletonText width={100} height={12} style={styles.simpleCardDateTimeText} />
              </View>

              {/* Warning indicator for some cards */}
              {i === 2 && (
                <View style={styles.warningIndicator}>
                  <SkeletonText width={14} height={14} style={styles.warningIcon} />
                  <SkeletonText width={50} height={10} style={styles.warningIndicatorText} />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isSmall ? 12 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIcon: {},
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  headerSubtitle: {
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    padding: isSmall ? 12 : 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isSmall ? 10 : 12,
    borderRadius: 8,
    margin: 2,
  },
  activeTab: {
    backgroundColor: '#1a294dff',
  },
  tabIcon: {
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  tabText: {
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  badge: {
    backgroundColor: '#1a294dff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeWarning: {
    backgroundColor: '#1a294dff',
  },
  badgeText: {
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  newComplaintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a294dff',
    padding: isSmall ? 14 : 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#1a294dff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    margin: 4,
  },
  buttonIcon: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  buttonText: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  simpleComplaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 4,
  },
  simpleComplaintCardTablet: {
    marginHorizontal: isLarge ? 20 : 0,
  },
  simpleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  simpleCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconPlaceholder: {
    borderRadius: 10,
    backgroundColor: '#1a294dff',
  },
  simpleCardTextContainer: {
    flex: 1,
  },
  simpleCardTitle: {
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  simpleCardSubtitle: {
    borderRadius: 7,
    backgroundColor: '#1a294dff',
  },
  simpleStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  simpleStatusText: {
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  simpleCardBody: {
    marginBottom: 12,
  },
  simpleCardDescription: {
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  simpleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simpleCardDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  simpleCardDateTimeText: {
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  warningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningIcon: {
    borderRadius: 7,
    backgroundColor: '#1a294dff',
    marginRight: 4,
  },
  warningIndicatorText: {
    borderRadius: 5,
    backgroundColor: '#1a294dff',
  },
});
