import React, { useContext, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../config/AuthContext";
import { commonStyles } from "../../style";
import { useRouter, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import { t } from "i18next";

const Message = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isPickingImage, setIsPickingImage] = useState(false); // Trạng thái mới để ngăn sự kiện kép
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const axiosInstance = useAxios();
  const { contact: contactString } = useLocalSearchParams();
  const stompClientRef = useRef(null);
  const flatListRef = useRef(null);
  const WEB_SOCKET_ENDPOINT = "https://vietchef.ddns.net/ws";
  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/deczpzvro/image/upload";
  const CLOUDINARY_UPLOAD_PRESET = "vietchef_image";

  const contact = contactString ? JSON.parse(contactString) : {};
  // const vietnamTime = moment().tz("Asia/Ho_Chi_Minh").format();

  useEffect(() => {
    const client = Stomp.over(() => new SockJS(WEB_SOCKET_ENDPOINT));
    stompClientRef.current = client;
    client.connect(
      {},
      () => {
        client.subscribe(`/user/${user.sub}/queue/messages`, onMessageReceived);
        client.subscribe(`/topic/public`, onMessageReceived);
      },
      onError
    );

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, []);

  const onMessageReceived = (payload) => {
    const receivedMessage = JSON.parse(payload.body);
    if (
      receivedMessage.senderId === contact.id ||
      receivedMessage.senderId === user.sub
    ) {
      setMessages((prev) => [...prev, receivedMessage]);
    }
  };

  const onError = (error) => {
    console.error("WebSocket error:", error);
    Toast.show({
      type: "error",
      text1: "Lỗi kết nối",
      text2: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
    });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/messages/${user.sub}/${contact.id}`
        );
        const sortedMessages = response.data.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateA - dateB;
        });
        setMessages(sortedMessages);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          setMessages([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const pickImage = async () => {
    if (isPickingImage) return; // Ngăn chặn sự kiện kép
    setIsPickingImage(true);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Quyền truy cập bị từ chối",
        text2:
          "Vui lòng cấp quyền truy cập thư viện ảnh trong cài đặt thiết bị.",
      });
      setIsPickingImage(false);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Chọn ảnh gốc
        quality: 0.8, // Giảm chất lượng nhẹ để tối ưu tốc độ
      });

      if (!result.canceled) {
        const { uri, fileSize } = result.assets[0];
        console.log("Selected image URI:", uri); // Log để gỡ lỗi
        if (fileSize && fileSize > 10 * 1024 * 1024) {
          Toast.show({
            type: "error",
            text1: "Ảnh quá lớn",
            text2: "Vui lòng chọn ảnh có kích thước dưới 10MB.",
          });
          setIsPickingImage(false);
          return;
        }
        setSelectedImage(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi chọn ảnh",
        text2: "Không thể chọn ảnh. Vui lòng thử lại.",
      });
    } finally {
      setIsPickingImage(false);
    }
  };
  const generateFileName = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8); // Chuỗi ngẫu nhiên 6 ký tự
    return `image_${timestamp}_${randomString}.jpg`;
  };
  const uploadImageToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", {
      uri: file,
      type: "image/jpeg",
      name: generateFileName(),
    });
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", "deczpzvro");

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (result.error) {
        console.error("Cloudinary error:", result.error);
        Toast.show({
          type: "error",
          text1: "Lỗi tải ảnh",
          text2: result.error.message || "Không thể tải ảnh lên Cloudinary.",
        });
        return null;
      }
      return result.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi tải ảnh",
        text2: "Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.",
      });
      return null;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;
    const client = stompClientRef.current;
    if (!client || !client.connected) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể kết nối đến WebSocket.",
      });
      return;
    }

    setIsSending(true);
    let newMessage;
    try {
      const now = new Date();
      now.setHours(now.getHours() + 7);
      const timestamp = now.toISOString().slice(0, -1);
      if (selectedImage) {
        const imageUrl = await uploadImageToCloudinary(selectedImage);
        newMessage = {
          senderId: user.sub,
          recipientId: contact.id,
          senderName: user.fullName,
          recipientName: contact.name,
          content: imageUrl,
          contentType: "image",
          timestamp: timestamp,
        };
      } else {
        newMessage = {
          senderId: user.sub,
          recipientId: contact.id,
          senderName: user.fullName,
          recipientName: contact.name,
          content: inputText,
          contentType: "text",
          timestamp: timestamp,
        };
        console.log("Tin nhắn:", newMessage.timestamp);
      }
      setMessages((prev) => [...prev, newMessage]);
      client.send("/app/chat", {}, JSON.stringify(newMessage));
      setSelectedImage(null);
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi gửi tin nhắn",
        text2: "Không thể gửi tin nhắn. Vui lòng thử lại.",
      });
    }
    setIsSending(false);
  };

  const sendLike = () => {
    const client = stompClientRef.current;
    if (!client || !client.connected) {
      console.warn("No underlying stomp connection");
      return;
    }
    const now = new Date();
    now.setHours(now.getHours() + 7);
    const timestamp = now.toISOString().slice(0, -1);

    const likeMessage = {
      senderId: user.sub,
      recipientId: contact.id,
      senderName: user.fullName,
      recipientName: contact.name,
      content: "👍",
      contentType: "text",
      timestamp: timestamp,
    };

    setMessages((prev) => [...prev, likeMessage]);
    client.send("/app/chat", {}, JSON.stringify(likeMessage));
  };

  const renderMessage = ({ item, index }) => {
    const messageDate = new Date(item.timestamp);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const prevMessageDate = prevMessage
      ? new Date(prevMessage.timestamp)
      : null;

    const showDate =
      !prevMessage ||
      messageDate.getDate() !== prevMessageDate.getDate() ||
      messageDate.getMonth() !== prevMessageDate.getMonth() ||
      messageDate.getFullYear() !== prevMessageDate.getFullYear();

    if (item.contentType === "image") {
      return (
        <>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>
                {messageDate.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.imageContainer,
              item.senderId === user.sub
                ? styles.senderAlign
                : styles.receiverAlign,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedImageUri(item.content);
                setModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.content }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.messageTime}>
              {messageDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </>
      );
    } else {
      // Tin nhắn dạng text như cũ
      return (
        <>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>
                {messageDate.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.messageContainer,
              item.senderId === user.sub ? styles.sender : styles.receiver,
            ]}
          >
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.messageTime}>
              {messageDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={contact.name} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#68A7AD" />
          <Text style={{ marginTop: 10 }}>{t("loadingMessages")}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.timestamp}_${index}`}
          renderItem={renderMessage}
          style={styles.chatContainer}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          // inverted
        />
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Text style={styles.imagePreviewText}>{t("selectedPhoto")}:</Text>
          <View style={styles.imagePreviewWrapper}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
              resizeMode="contain" // Thay đổi để hiển thị ảnh đầy đủ
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageButtonText}>x</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} disabled={isPickingImage}>
          <Ionicons
            name="image"
            size={24}
            color={isPickingImage ? "gray" : "black"}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={t("enterMessage")}
          value={inputText}
          onChangeText={setInputText}
        />
        {inputText.trim() || selectedImage ? (
          <TouchableOpacity onPress={sendMessage}>
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={24} color="black" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={sendLike}>
            <AntDesign name="like1" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingLeft: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 20,
  },
  buttonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    maxWidth: "75%",
    marginVertical: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.0,
    elevation: 3,
    marginBottom: 20,
  },
  sender: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    marginRight: 10,
  },
  receiver: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    marginLeft: 10,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
    alignSelf: "flex-end",
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 14,
    color: "gray",
  },
  imageContainer: {
    marginVertical: 5,
    alignItems: "flex-start", // hoặc "flex-end" nếu sender
  },
  senderAlign: {
    alignSelf: "flex-end",
    marginRight: 10,
  },
  receiverAlign: {
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#F4EDE4",
  },
  input: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#68A7AD",
    borderRadius: 20,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  imagePreviewContainer: {
    padding: 10,
  },
  imagePreviewText: {
    color: "#000",
    marginBottom: 4,
  },
  imagePreviewWrapper: {
    width: 100,
    height: 100,
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: "#FF0000",
    borderRadius: "100%",
    height: 20,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default Message;
