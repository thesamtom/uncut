import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
    Alert.alert(
      'Notifications',
      notificationsEnabled
        ? 'Notifications have been turned off.'
        : 'Notifications have been turned on.',
    );
  };

  const handleAppearance = () => {
    Alert.alert(
      'Appearance',
      'Dark mode coming soon! The app currently uses a light theme.',
      [{ text: 'OK' }],
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy',
      'Your data is stored securely with Supabase. We never share your personal information with third parties. Your watchlist and account data can be deleted at any time by contacting support.',
      [{ text: 'OK' }],
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@uncutapp.com?subject=Uncut App Support'),
        },
      ],
    );
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : '??';

  const menuItems = [
    {
      icon: 'notifications-outline' as const,
      label: 'Notifications',
      onPress: handleNotifications,
      right: (
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotifications}
          trackColor={{ false: Colors.border, true: Colors.accent }}
          thumbColor="#FFFFFF"
        />
      ),
    },
    { icon: 'color-palette-outline' as const, label: 'Appearance', onPress: handleAppearance },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy', onPress: handlePrivacy },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: handleHelp },
    { icon: 'information-circle-outline' as const, label: 'About Uncut', onPress: () => setShowAboutModal(true) },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.email}>{user?.email || 'Not signed in'}</Text>
        <Text style={styles.memberSince}>
          Member since {user?.created_at
            ? new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : '—'}
        </Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            {'right' in item && item.right ? (
              item.right
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Uncut v1.0.0</Text>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="film" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.modalTitle}>UNCUT</Text>
            <Text style={styles.modalVersion}>Version 1.0.0</Text>
            <Text style={styles.modalDescription}>
              Uncut is your go-to app for discovering upcoming movies across Malayalam, Hindi, and Hollywood cinema. Track release dates, watch trailers, and build your personal watchlist.
            </Text>
            <Text style={styles.modalCredit}>Made with {'\u2764\uFE0F'} for movie lovers</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    color: Colors.textPrimary,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.accent,
  },
  email: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: Fonts.black,
    color: Colors.accent,
    letterSpacing: 3,
  },
  modalVersion: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  modalCredit: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  modalButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.lg,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});

export default ProfileScreen;
