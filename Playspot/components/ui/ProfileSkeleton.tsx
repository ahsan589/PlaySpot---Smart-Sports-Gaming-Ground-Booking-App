import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';

const { width } = Dimensions.get('window');
const isSmall = width < 400;

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <SkeletonText width={40} height={40} style={styles.avatarIcon} />
            </View>
            <View style={styles.cameraIcon}>
              <SkeletonText width={16} height={16} style={styles.cameraIconPlaceholder} />
            </View>
          </View>

          <View style={styles.userInfo}>
            <SkeletonText width={180} height={28} style={styles.userName} />
            <View style={styles.roleContainer}>
              <View style={styles.roleBadge}>
                <SkeletonText width={14} height={14} style={styles.roleIcon} />
                <SkeletonText width={50} height={12} style={styles.roleText} />
              </View>
              <View style={styles.statusBadge}>
                <SkeletonText width={60} height={12} style={styles.statusText} />
              </View>
            </View>
            <SkeletonText width={140} height={14} style={styles.userEmail} />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <SkeletonText width={14} height={14} style={styles.statIcon} />
                <SkeletonText width={120} height={13} style={styles.statText} />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Glow Effect */}
        <View style={styles.bottomGlow} />
      </View>

      {/* Personal Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <SkeletonText width={24} height={24} style={styles.cardIconPlaceholder} />
          </View>
          <SkeletonText width={150} height={18} style={styles.cardTitle} />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <SkeletonText width={20} height={20} style={styles.infoIconPlaceholder} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonText width={60} height={12} style={styles.infoLabel} />
              <SkeletonText width="70%" height={16} style={styles.infoText} />
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <SkeletonText width={20} height={20} style={styles.infoIconPlaceholder} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonText width={90} height={12} style={styles.infoLabel} />
              <SkeletonText width="60%" height={16} style={styles.infoText} />
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <SkeletonText width={20} height={20} style={styles.infoIconPlaceholder} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonText width={50} height={12} style={styles.infoLabel} />
              <SkeletonText width="50%" height={16} style={styles.infoText} />
            </View>
          </View>
        </View>
      </View>

      {/* Account Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <SkeletonText width={24} height={24} style={styles.cardIconPlaceholder} />
          </View>
          <SkeletonText width={140} height={18} style={styles.cardTitle} />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <SkeletonText width={20} height={20} style={styles.infoIconPlaceholder} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonText width={80} height={12} style={styles.infoLabel} />
              <SkeletonText width="50%" height={16} style={styles.infoText} />
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <SkeletonText width={20} height={20} style={styles.infoIconPlaceholder} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonText width={90} height={12} style={styles.infoLabel} />
              <SkeletonText width="40%" height={16} style={styles.infoText} />
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <SkeletonText width={20} height={20} style={styles.infoIconPlaceholder} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonText width={80} height={12} style={styles.infoLabel} />
              <View style={styles.roleContainer}>
                <SkeletonText width={50} height={16} style={styles.roleBadgeText} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.editButton}>
          <SkeletonText width={20} height={20} style={styles.buttonIcon} />
          <SkeletonText width={80} height={16} style={styles.buttonText} />
        </View>

        <View style={styles.logoutButton}>
          <SkeletonText width={20} height={20} style={styles.buttonIcon} />
          <SkeletonText width={70} height={16} style={styles.buttonText} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 20,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a294dff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarIcon: {},
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a294dff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIconPlaceholder: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a294dff',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a294dff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleIcon: {
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  roleText: {
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    borderRadius: 7,
    backgroundColor: '#1a294dff',
    marginRight: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 4,
    backgroundColor: '#1a294dff',
    borderRadius: 2,
    opacity: 0.6,
    shadowColor: '#1a294dff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconPlaceholder: {
    borderRadius: 10,
    backgroundColor: '#1a294dff',
  },
  cardTitle: {},
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIconPlaceholder: {
    borderRadius: 10,
    backgroundColor: '#1a294dff',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  roleContainer: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    borderRadius: 8,
    backgroundColor: '#475569',
  },
  actionContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 0,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a294dff',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#1a294dff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
});
