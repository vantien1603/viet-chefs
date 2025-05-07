import React, { useContext, useState, useEffect } from "react";
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
import Toast from "react-native-toast-message";

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const navigation = useNavigation();
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.sub) {
        console.error("No username found");
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy username",
        });
        return;
      }

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/conversations/${user.sub}`);
        console.log("Dữ liệu conversations:", response.data);
        const messagesData = await Promise.all(
          response.data.map(async (message) => {
            const otherUserId =
              message.senderId === user.sub
                ? message.recipientId
                : message.senderId;
            const otherUserName =
              message.senderId === user.sub
                ? message.recipientName
                : message.senderName;
            let avatarUrl = null;
            try {
              const userResponse = await axiosInstance.get(
                `/users/${otherUserId}`
              );
              avatarUrl = userResponse.data?.avatarUrl || null;
              console.log(`Avatar for ${otherUserId}:`, avatarUrl);
            } catch (error) {
              console.error(`Lỗi khi lấy dữ liệu người dùng ${otherUserId}:`, error);
            }
            return {
              id: message.chatId,
              username: otherUserId,
              name: otherUserName,
              message: message.content,
              senderName: message.senderName,
              time: new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              read: true,
              avatarUrl, // Thêm avatarUrl
            };
          })
        );
        setConversations(messagesData);
      } catch (error) {
        console.error("Lỗi khi lấy conversations:", error);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tải được danh sách trò chuyện",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.sub]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() =>
        navigation.navigate("screen/message", {
          contact: JSON.stringify({
            id: item.username,
            name: item.name,
            avatarUrl: item.avatarUrl, // Use avatarUrl instead of avatar
          }),
        })
      }
    >
      <Image
        source={{ uri: item.avatarUrl }}
        style={styles.avatar}
      />
      <View style={styles.messageContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
          {item.senderName}: {item.message}
        </Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={"Chat"} />
      <View style={commonStyles.containerContent}>
        <View style={commonStyles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="gray"
            style={commonStyles.searchIcon}
          />
          <TextInput style={commonStyles.searchInput} placeholder="Tìm kiếm" />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={conversations}
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
    fontWeight: "600",
    marginBottom: 5,
  },
  message: {
    fontSize: 16,
    color: "#000",
  },
  time: {
    fontSize: 14,
    color: "#7F7F7F",
    marginRight: 10,
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