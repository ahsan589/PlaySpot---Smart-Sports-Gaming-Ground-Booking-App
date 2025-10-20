import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 400;

const OwnerComplaintsSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Placeholder */}
      <View style={styles.headerPlaceholder}>
        <View style={styles.headerIconPlaceholder} />
        <View style={styles.headerTextContainer}>
          <View style={styles.headerTitlePlaceholder} />
          <View style={styles.headerSubtitlePlaceholder} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Tab Container Placeholder */}
        <View style={styles.tabContainer}>
          <View style={[styles.tab, styles.activeTabPlaceholder]} />
          <View style={styles.tab} />
        </View>

        {/* New Complaint Button Placeholder */}
        <View style={styles.newComplaintButtonPlaceholder} />

        {/* Complaints List Placeholders */}
        {[...Array(4)].map((_, index) => (
          <View key={index} style={styles.complaintCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <View style={styles.iconPlaceholder} />
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitlePlaceholder} />
                  <View style={styles.cardSubtitlePlaceholder} />
                </View>
              </View>
              <View style={styles.statusBadgePlaceholder} />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.descriptionPlaceholder} />
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.dateTimePlaceholder} />
              <View style={styles.warningPlaceholder} />
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
    backgroundColor: '#F9FAFB',
  },
  headerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isSmall ? 12 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitlePlaceholder: {
    width: 180,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  headerSubtitlePlaceholder: {
    width: 140,
    height: 16,
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
  },
  tab: {
    flex: 1,
    padding: isSmall ? 10 : 12,
    borderRadius: 8,
    margin: 2,
    backgroundColor: '#F3F4F6',
  },
  activeTabPlaceholder: {
    backgroundColor: '#E5E7EB',
  },
  newComplaintButtonPlaceholder: {
    backgroundColor: '#E5E7EB',
    padding: isSmall ? 14 : 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitlePlaceholder: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  cardSubtitlePlaceholder: {
    width: 80,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
  },
  statusBadgePlaceholder: {
    width: 70,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  cardBody: {
    marginBottom: 12,
  },
  descriptionPlaceholder: {
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  dateTimeIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  dateTimeTextPlaceholder: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  warningPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginRight: 4,
  },
  warningTextPlaceholder: {
    width: 60,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
});

export { OwnerComplaintsSkeleton };

