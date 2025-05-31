import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import { AuthContext } from "../../config/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/header";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { useFocusEffect } from "expo-router";
import { SocketContext } from "../../config/SocketContext";

const Chat = () => {
  const { user, isGuest } = useContext(AuthContext);
  // const { registerNotificationCallback } = useContext(SocketContext);
  const { lastMessage  } = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const navigation = useNavigation();
  const axiosInstance = useAxios();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [shouldRefetch, setShouldRefetch] = useState(0);

  // console.log("call", notificationsCallback);

  const fetchConversations = async () => {
    if (!user?.sub || isGuest) {
      console.log("No username found");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/conversations/${user?.sub}`);
      console.log("Dữ liệu conversations:", response.data);
      const messagesData = await Promise.all(
        response.data.map(async (message) => {
          const otherUserId =
            message.senderId === user?.sub
              ? message.recipientId
              : message.senderId;
          const otherUserName =
            message.senderId === user?.sub
              ? message.recipientName
              : message.senderName;
          let avatarUrl = null;
          try {
            const userResponse = await axiosInstance.get(
              `/users/${otherUserId}`
            );
            avatarUrl = userResponse.data?.avatarUrl;
          } catch (error) {
            console.error(
              `Lỗi khi lấy dữ liệu người dùng ${otherUserId}:`,
              error
            );
          }

          const messageDate = new Date(message.timestamp);
          const now = new Date();

          // Tính số ngày cách nhau
          const diffTime = now.getTime() - messageDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Tính năm và tuần
          const sameYear = now.getFullYear() === messageDate.getFullYear();
          const sameWeek =
            now.getFullYear() === messageDate.getFullYear() &&
            getWeekNumber(now) === getWeekNumber(messageDate);

          let displayTime;

          if (diffDays === 0) {
            // Hôm nay -> giờ phút
            displayTime = messageDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else if (diffDays === 1) {
            // Hôm qua
            displayTime = "Yesterday";
          } else if (sameWeek) {
            // Trong tuần -> thứ
            displayTime = messageDate.toLocaleDateString("en-US", {
              weekday: "long",
            });
          } else if (sameYear) {
            // Trong năm -> ngày/tháng
            displayTime = messageDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
            });
          } else {
            // Năm trước -> ngày/tháng/năm
            displayTime = messageDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }

          // Hàm lấy số tuần trong năm
          function getWeekNumber(date) {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear =
              (date -
                firstDayOfYear +
                (firstDayOfYear.getTimezoneOffset() -
                  date.getTimezoneOffset()) *
                60000) /
              86400000;
            return Math.ceil(
              (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
            );
          }

          return {
            id: message.chatId,
            username: otherUserId,
            name: otherUserName,
            message: message.content,
            senderId: message.senderId,
            senderName: message.senderName,
            contentType: message.contentType,
            time: displayTime,
            timestamp: message.timestamp,
            avatarUrl,
          };
        })
      );
      messagesData.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setConversations(messagesData);
      setFilteredConversations(messagesData);
    } catch (error) {
      console.log("Lỗi khi lấy conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [lastMessage ])
  );

  // useEffect(() => {
  //   registerNotificationCallback(() => {
  //     setShouldRefetch((prev) => prev + 1);
  //   });
  // }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      // Nếu ô tìm kiếm trống, show full list
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() =>
        navigation.navigate("screen/message", {
          contact: JSON.stringify({
            id: item.username,
            name: item.name,
            avatarUrl: item.avatarUrl,
          }),
        })
      }
    >
      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      <View style={styles.messageContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
          {item.contentType === "image"
            ? item.senderId === user?.sub
              ? t("youSentImage")
              : t("chefSentImage")
            : `${item.senderName}: ${item.message}`}
        </Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("chat")} />
      <View style={commonStyles.containerContent}>
        <View style={commonStyles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="gray"
            style={commonStyles.searchIcon}
          />
          <TextInput
            style={commonStyles.searchInput}
            placeholder={t("search")}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 40,
    marginRight: 15,
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 5,
  },
  message: {
    fontSize: 16,
    color: "#000",
    fontFamily: "nunito-regular"
  },
  time: {
    fontSize: 14,
    color: "#7F7F7F",
    marginRight: 10,
    fontFamily: "nunito-regular"
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#4EA0B7",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});

export default Chat;
