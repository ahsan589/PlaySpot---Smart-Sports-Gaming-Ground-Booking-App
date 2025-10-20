import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

export const PaymentSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.gradientHeader}>
        <SkeletonText width={120} height={24} style={styles.headerTitle} />
        <SkeletonText width={180} height={14} style={styles.headerSubtitle} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Booking Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SkeletonText width={20} height={20} style={styles.icon} />
            <SkeletonText width={120} height={14} style={styles.cardHeaderText} />
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <SkeletonText width={16} height={16} style={styles.icon} />
              <SkeletonText width="60%" height={14} />
            </View>

            <View style={styles.detailRow}>
              <SkeletonText width={16} height={16} style={styles.icon} />
              <SkeletonText width="50%" height={14} />
            </View>

            <View style={styles.detailRow}>
              <SkeletonText width={16} height={16} style={styles.icon} />
              <SkeletonText width="70%" height={14} />
            </View>

            <View style={styles.detailRow}>
              <SkeletonText width={16} height={16} style={styles.icon} />
              <SkeletonText width="55%" height={14} />
            </View>
          </View>

          <View style={styles.amountContainer}>
            <SkeletonText width={80} height={16} style={styles.amountLabel} />
            <SkeletonText width={100} height={24} style={styles.amount} />
          </View>
        </View>

        {/* Section Title */}
        <SkeletonText width={150} height={18} style={styles.sectionTitle} />

        {/* Payment Options */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.paymentCard}>
            <View style={styles.methodInfo}>
              <SkeletonText width={50} height={50} style={styles.iconContainer} />
              <View style={styles.methodTextContainer}>
                <SkeletonText width="60%" height={16} style={styles.methodName} />
                <SkeletonText width="80%" height={12} style={styles.methodDescription} />
              </View>
            </View>
            <SkeletonText width={24} height={24} style={styles.radioButton} />
          </View>
        ))}

        {/* Features Card */}
        <View style={styles.featuresCard}>
          <SkeletonText width={100} height={16} style={styles.featuresTitle} />
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <SkeletonText width={20} height={20} style={styles.icon} />
              <SkeletonText width="80%" height={12} style={styles.featureText} />
            </View>
            <View style={styles.featureItem}>
              <SkeletonText width={20} height={20} style={styles.icon} />
              <SkeletonText width="80%" height={12} style={styles.featureText} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <SkeletonText width="100%" height={50} style={styles.payButton} />
        <View style={styles.securityNote}>
          <SkeletonText width={16} height={16} style={styles.icon} />
          <SkeletonText width="70%" height={12} style={styles.securityText} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#f8f9fa',
  },
  gradientHeader: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    padding: 20,
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {},
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  icon: {
    borderRadius: 10,
  },
  cardHeaderText: {
    marginLeft: 8,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  amountLabel: {},
  amount: {},
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 20,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginHorizontal: 20,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    borderRadius: 25,
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodName: {
    marginBottom: 4,
  },
  methodDescription: {},
  radioButton: {
    borderRadius: 12,
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 20,
  },
  featuresTitle: {
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 20,
    marginHorizontal: 20,
  },
  payButton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  securityText: {
    marginLeft: 8,
  },
});
