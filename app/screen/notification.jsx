import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { router } from "expo-router";
import { AuthContext } from "../../config/AuthContext";

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const axiosInstance = useAxios();
  const { isGuest } = useContext(AuthContext);

  const fetchNotification = async () => {
    try {
      if (isGuest) return;
      const response = await axiosInstance.get("/notifications/my");
      if (response.status === 200) {
        // Sort notifications by createdAt descending
        const sortedNotifications = response.data.content.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.log("Error", error);
    }
  };

  const toggleReadStatus = (notificationId) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: !notification.read }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  useEffect(() => {
    fetchNotification();
  }, []);

  const handleNotificationPress = (item) => {
    const { title, bookingId, bookingDetailId } = item;
    const params = { bookingId };
    if (bookingDetailId) params.bookingDetailId = bookingDetailId;

    switch (title) {
      case "Booking Confirmed":
        router.push({
          pathname: "/(tabs)/history",
          params: { tab: "confirm", ...params },
        });
        break;
      case "Booking Expired":
        router.push({
          pathname: "(tabs)/history",
          params: { tab: "cancel", ...params },
        });
        break;
      case "Please Confirm Your Booking with a Deposit":
        router.push({
          pathname: "/(tabs)/history",
          params: { tab: "pending", ...params },
        });
        break;
      case "Booking Created Successfully":
        router.push({
          pathname: "/(tabs)/history",
          params: { tab: "", ...params },
        });
        break;
      case "Deposit Successful":
        router.push({
          pathname: "/(tabs)/history",
          params: { tab: "paidDeposit", ...params },
        });
        break;
      case "Payment Successful":
        router.push({
          pathname: "/(tabs)/history",
          params: { tab: "paidDeposit", ...params },
        });
        break;
      case "Booking Overdue & Refunded":
        router.push({
          pathname: "/(tabs)/history",
          params: { tab: "cancel", ...params },
        });
        break;
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => toggleReadStatus(item.id)}
        style={styles.readButton}
      >
        {item.read && <Ionicons name="checkmark-done" size={24} color="#ccc" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Thông báo" />
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerActions: {
    padding: 10,
    alignItems: "flex-end",
  },
  markAllButton: {
    padding: 8,
    backgroundColor: "#4EA0B7",
    borderRadius: 5,
  },
  markAllText: {
    color: "#fff",
    fontSize: 14,
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  readButton: {
    padding: 5,
    minWidth: 34,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default NotificationScreen;
