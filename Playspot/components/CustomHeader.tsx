import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getUserDisplayName } from '../utils/cricketUtils';

interface CustomHeaderProps {
  title?: string;
  subtitle?: string;
  showUserInfo?: boolean;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title = "Cricket Grounds",
  subtitle = "Discover amazing places to play",
  showUserInfo = true
}) => {
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <View style={styles.header}>
      <View style={styles.headerBackground} />
      <View style={styles.headerContent}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {showUserInfo && (
          <View style={styles.userContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.welcome}>Welcome back,</Text>
              <Text style={styles.userName}>
                {getUserDisplayName(user)}
              </Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#667eea" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fcfcfcff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#667eea',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a227e8e',
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  userInfo: {
    marginRight: 8,
  },
  welcome: {
    fontSize: 10,
    color: '#667eea',
  },
  userName: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
