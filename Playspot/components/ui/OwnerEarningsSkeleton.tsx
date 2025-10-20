import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const OwnerEarningsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gradientHeader}>
        <LinearGradient
          colors={['#232427ff', '#2d2e32ff']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="wallet-outline" size={24} color="#fbfcffff" />
            </View>
            <View style={styles.headerTextContainer}>
              <View style={styles.titleSkeleton} />
              <View style={styles.subtitleSkeleton} />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={styles.earningsSummary}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer} />
            <View style={styles.labelSkeleton} />
            <View style={styles.amountSkeleton} />
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.smallCard]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#e8f5e9' }]} />
              <View style={styles.labelSkeleton} />
              <View style={styles.amountSkeletonSmall} />
            </View>

            <View style={[styles.summaryCard, styles.smallCard]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#e3f2fd' }]} />
              <View style={styles.labelSkeleton} />
              <View style={styles.amountSkeletonSmall} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.smallCard]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#fce4ec' }]} />
              <View style={styles.labelSkeleton} />
              <View style={styles.amountSkeletonSmall} />
            </View>

            <View style={[styles.summaryCard, styles.smallCard]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#fff3e0' }]} />
              <View style={styles.labelSkeleton} />
              <View style={styles.amountSkeletonSmall} />
            </View>
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleSkeletonSmall} />
            <View style={styles.filterSkeleton} />
          </View>

          {[...Array(4)].map((_, index) => (
            <View key={index} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.groundInfo}>
                  <View style={styles.iconSkeleton} />
                  <View style={styles.groundNameSkeleton} />
                </View>
                <View style={styles.statusSkeleton} />
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.amountContainer}>
                  <View style={styles.amountSkeleton} />
                  <View style={styles.dateSkeleton} />
                </View>

                <View style={styles.paymentMethod}>
                  <View style={styles.methodIconSkeleton} />
                  <View style={styles.methodTextSkeleton} />
                </View>
              </View>
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
  },
  gradientBackground: {
    padding: 20,
    paddingVertical: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  titleSkeleton: {
    width: 200,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 4,
  },
  subtitleSkeleton: {
    width: 180,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: 10,
  },
  earningsSummary: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallCard: {
    flex: 1,
    marginHorizontal: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  labelSkeleton: {
    width: 80,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  amountSkeleton: {
    width: 120,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
  },
  amountSkeletonSmall: {
    width: 60,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSkeletonSmall: {
    width: 150,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  filterSkeleton: {
    width: 120,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  groundNameSkeleton: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  statusSkeleton: {
    width: 60,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'flex-start',
  },
  dateSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  methodTextSkeleton: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
});

export { OwnerEarningsSkeleton };

