import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Header from "../../components/header"; 
import { commonStyles } from '../../style';

// Dữ liệu mẫu cho thông báo
const dummyNotifications = [
  {
    id: '1',
    title: 'Cập nhật mới',
    message: 'Ứng dụng vừa được cập nhật phiên bản mới',
    time: '2 giờ trước',
  },
  {
    id: '2',
    title: 'Tin nhắn mới',
    message: 'Bạn có tin nhắn từ Minh',
    time: '3 giờ trước',
  },
  {
    id: '3',
    title: 'Nhắc nhở',
    message: 'Đừng quên cuộc họp lúc 14:00',
    time: '1 ngày trước',
  },
];

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState(dummyNotifications);

  // Component render từng item thông báo
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  // Hiển thị khi không có thông báo
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Thông báo" />
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default NotificationScreen;