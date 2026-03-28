import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  MessageCircle, 
  Briefcase, 
  DollarSign, 
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,

  ArrowRight
} from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import type { Notification, NotificationType } from '@/types';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return MessageCircle;
    case 'application':
    case 'approval':
    case 'rejection':
      return Briefcase;
    case 'deal':
    case 'deal_completed':
      return CheckCircle;
    case 'payment_received':
      return DollarSign;
    case 'reward':
    case 'achievement':
      return Award;
    case 'match':
      return TrendingUp;
    case 'trending':
    case 'opportunity':
      return TrendingUp;
    case 'milestone':
      return Award;
    case 'reminder':
    case 'engagement':
      return AlertCircle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return Colors.info;
    case 'application':
      return Colors.warning;
    case 'approval':
    case 'deal_completed':
      return Colors.success;
    case 'rejection':
      return Colors.danger;
    case 'deal':
      return Colors.primary;
    case 'payment_received':
      return Colors.success;
    case 'reward':
    case 'achievement':
    case 'milestone':
      return Colors.warning;
    case 'match':
    case 'trending':
    case 'opportunity':
      return Colors.accent;
    case 'reminder':
    case 'engagement':
      return Colors.secondary;
    default:
      return Colors.primary;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { color: Colors.danger, label: 'URGENT' };
    case 'high':
      return { color: Colors.warning, label: 'HIGH' };
    case 'medium':
      return { color: Colors.info, label: 'MEDIUM' };
    default:
      return null;
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, markNotificationRead } = useData();

  const userNotifications = notifications
    .filter(n => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = userNotifications.filter(n => !n.read);
    for (const notif of unreadNotifications) {
      await markNotificationRead(notif.id);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = (notification: Notification) => {
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    const priorityBadge = getPriorityBadge(notification.priority);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            notification.read
              ? [Colors.darkCard, Colors.backgroundSecondary]
              : [Colors.primary + '15', Colors.darkCard]
          }
          style={styles.notificationGradient}
        >
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
              <Icon size={20} color={iconColor} />
            </View>

            <View style={styles.notificationText}>
              <View style={styles.notificationHeader}>
                <Text
                  style={[
                    styles.notificationTitle,
                    !notification.read && styles.notificationTitleUnread,
                  ]}
                  numberOfLines={1}
                >
                  {notification.title}
                </Text>
                {priorityBadge && (
                  <View style={[styles.priorityBadge, { backgroundColor: priorityBadge.color + '20' }]}>
                    <Text style={[styles.priorityText, { color: priorityBadge.color }]}>
                      {priorityBadge.label}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.notificationMessage,
                  !notification.read && styles.notificationMessageUnread,
                ]}
                numberOfLines={2}
              >
                {notification.message}
              </Text>

              <View style={styles.notificationFooter}>
                <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
                {notification.actionLabel && (
                  <View style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>{notification.actionLabel}</Text>
                    <ArrowRight size={14} color={Colors.primary} />
                  </View>
                )}
              </View>
            </View>

            {!notification.read && <View style={styles.unreadDot} />}
          </View>

          {notification.imageUrl && (
            <Image source={{ uri: notification.imageUrl }} style={styles.notificationImage} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <CheckCircle size={20} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsListContent}
        showsVerticalScrollIndicator={false}
      >
        {userNotifications.length > 0 ? (
          userNotifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
            <Bell size={64} color={Colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              We&apos;ll notify you when something important happens
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.darkCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsListContent: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  notificationCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  notificationCardUnread: {
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  notificationGradient: {
    padding: 16,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  notificationTitleUnread: {
    fontWeight: '700' as const,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  notificationMessageUnread: {
    color: Colors.text,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  notificationImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
