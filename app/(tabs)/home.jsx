import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { commonStyles } from "../../style";
import * as Location from "expo-location";
import { t } from "i18next";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";
import CustomChat from "../../components/CustomChat.jsx";
import { SocketContext } from "../../config/SocketContext.js";


export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [chef, setChef] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [chefFavorite, setChefFavorite] = useState([]);
  const axiosInstance = useAxios();
  const { user, isGuest } = useContext(AuthContext);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [location, setLocation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loadingChef, setLoadingChef] = useState(false);
  const [loadingDish, setLoadingDish] = useState(false);
  const { showModal } = useCommonNoification();

  const [messages, setMessages] = useState([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const { registerNotificationCallback } = useContext(SocketContext);

  const initialMessages = [
    {
      role: "assistant",
      content:
        t("botHello"),
      suggestContactAdmin: false,
    },
    {
      role: "assistant",
      content: t("botHowCanIHelp"),
      suggestContactAdmin: false,
    },
  ];

  useEffect(() => {
    if (isChatVisible && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [isChatVisible]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (!isGuest) {
      registerNotificationCallback(() => {
        fetchUnreadCount();
      });
    }

  }, []);

  useEffect(() => {
    if (location) {
      fetchChef();
      fetchDishes();
      if (!isGuest) {
        fetchChefFavorite();
      }
    }
  }, [location]);



  const fetchUnreadCount = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notifications/my/count");
      if (response.status === 200) {
        const unread = response.data.notiNotChat;
        setUnreadCount(unread);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình xử lý", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showModal("Quyền truy cập vị trí bị từ chối", "Vui lòng cấp quyền để tìm kiếm đầu bếp và món ăn gần bạn.", "Failed");
        return null;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
    } catch (error) {
      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình xác định vị trí", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (coords) => {
    setLoading(true);
    try {
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (reverseGeocode.length > 0) {
        let addr = reverseGeocode[0];
        let fullAddress = `${addr.name || ""}, ${addr.street || ""}, ${addr.city || ""
          }, ${addr.region || ""}, ${addr.country || ""}`
          .replace(/,,/g, ",")
          .trim();
        return {
          id: "current-location",
          title: "Vị trí hiện tại",
          address: fullAddress,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }
      return null;
    } catch (error) {
      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình reverse geocoding", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        setSelectedAddress(parsedAddress);
        if (parsedAddress.latitude && parsedAddress.longitude) {
          setLocation({
            latitude: parsedAddress.latitude,
            longitude: parsedAddress.longitude,
          });
        } else {
          const currentCoords = await getCurrentLocation();
          if (currentCoords) setLocation(currentCoords);
        }
      } else {
        const currentCoords = await getCurrentLocation();
        if (currentCoords) {
          const fetchedAddress = await reverseGeocode(currentCoords);
          if (fetchedAddress) {
            await AsyncStorage.setItem(
              "selectedAddress",
              JSON.stringify(fetchedAddress)
            );
            setSelectedAddress(fetchedAddress);
            setLocation(currentCoords);
          }
        }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải địa chỉ", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchChefFavorite = async () => {
    setLoadingFavorite(true);
    try {
      if (!location) return;
      // const response = await axiosInstance.get("/favorite-chefs/nearby", {
      //   params: {
      //     customerLat: location.latitude,
      //     customerLng: location.longitude,
      //     distance: 30,
      //     sortBy: "id",
      //     sortDir: "asc",
      //   },
      // });
      const response = await axiosInstance.get(
        `/favorite-chefs/${user.userId}`,
        {
          params: {
            pageSize: 7,
            sortBy: "createdAt",
            sortDir: "desc",
          },
        }
      );
      setChefFavorite(response.data.content);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(t("modal.error"), error.response.data.message, "Failed");
    }
    finally {
      setLoadingFavorite(false);
    }
  };

  const fetchChef = async () => {
    setLoadingChef(true);
    try {
      if (!location) return;
      const response = await axiosInstance.get("/chefs/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          sortBy: "id",
          sortDir: "asc",
        },
      });
      if (response.status === 200) setChef(response.data.content.slice(0, 7));
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;

      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình lấy thông tin đầu bếp", "Failed");
    } finally {
      setLoadingChef(false);
    }
  };

  const fetchDishes = async () => {
    setLoadingDish(true);
    try {
      if (!location) return;
      const response = await axiosInstance.get("/dishes/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          sortBy: "id",
          sortDir: "asc",
        },
      });
      setDishes(response.data.content.slice(0, 7));
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải thông tin món ăn", "Failed");
    } finally {
      setLoadingDish(false);
    }
  };

  const handleSend = (userMessage) => {
    setMessages((prev) => [...prev, userMessage]);
  };

  const handleChatbot = async (inputText) => {
    try {
      const response = await axiosInstance.post("/chatbot/ask", null, {
        params: {
          message: inputText,
        },
      });
      const replyContent = response.data.reply;
      const suggestContactAdmin = response.data.suggestContactAdmin || false;
      const botMessage = {
        role: "assistant",
        content: replyContent,
        suggestContactAdmin: suggestContactAdmin,
      };
      setMessages((prev) => [...prev, botMessage]);
      console.log("Bot response:", response.data);
    } catch (error) {
      console.log("Error in handleChatbot:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Xin lỗi, tôi không thể trả lời ngay bây giờ. Vui lòng thử lại",
          suggestContactAdmin: false,
        },
      ]);
    }
  };

  const toggleChat = () => {
    if (isChatVisible) {
      setMessages([]);
    }
    setIsChatVisible(!isChatVisible);
  };

  const handleSearchIconPress = () => {
    router.push({
      pathname: "/screen/search",
      params: {
        selectedAddress: selectedAddress
          ? JSON.stringify(selectedAddress)
          : null,
      },
    });
  };

  const renderChefFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/screen/chefDetail",
          params: { chefId: item.chefId },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item?.chefAvatar,
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.chefName}</Text>
      <Text style={{ color: "#F8BF40", fontFamily: "nunito-regular" }}>
        {item.chefSpecialization}
      </Text>
    </TouchableOpacity>
  );

  const renderDishItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/screen/dishDetails",
          params: { dishId: item.id },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.name}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: "#F8BF40", fontFamily: "nunito-regular" }}>{t('basePrice')}: {item.basePrice}$</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: "#F8BF40", fontFamily: "nunito-regular" }}>{item.description}</Text>
      <Text style={{ color: '#F8BF40', fontSize: 12, fontFamily: "nunito-regular" }}> {t('distance')}: {item.chef.distance.toFixed(2)} km</Text>

    </TouchableOpacity>
  );

  const renderChefItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/screen/chefDetail",
          params: { chefId: item.id },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.user.avatarUrl,
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.user.fullName}</Text>
      {/* <Text style={{ color: "#F8BF40" }}>{t('price')}: {item.price}</Text> */}
      <Text style={{ color: "#F8BF40", fontFamily: "nunito-regular" }}>{item.specialization}</Text>
      <Text style={{ color: '#F8BF40', fontSize: 12, fontFamily: "nunito-regular" }}> {t('distance')}: {item.distance.toFixed(2)} km</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("screen/editAddress")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={
                user
                  ? { uri: user?.avatarUrl }
                  : require("../../assets/images/logo.png")
              }
              style={{ width: 50, height: 50, borderRadius: 30 }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 10, maxWidth: 200 }}>
              <Text
                style={{
                  fontSize: 18,
                  color: "#383838",
                  fontFamily: "nunito-regular",
                }}
              >
                Hello, {user?.fullName || "Guest"}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: selectedAddress ? "#968B7B" : "#A9411D",
                  fontStyle: selectedAddress ? "normal" : "italic",
                  fontFamily: selectedAddress
                    ? "nunito-regular"
                    : "nunito-bold",
                }}
                numberOfLines={2}
              >
                {selectedAddress
                  ? selectedAddress.address
                  : t("pleaseSelectAddress")}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/screen/notification")}>
          <View style={styles.notificationIconContainer}>
            <Ionicons name="notifications" size={30} color="#4EA0B7" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
          <Image
            source={require("../../assets/images/promo.png")}
            style={{ width: "100%", height: 150, borderRadius: 30 }}
            resizeMode="cover"
          />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              const searchQuery = String(query || "").trim();
              router.push({
                pathname: "/screen/search",
                params: {
                  query: searchQuery,
                  selectedAddress: selectedAddress
                    ? JSON.stringify(selectedAddress)
                    : null,
                },
              });
            }}
            onFocus={() => {
              router.push({
                pathname: "/screen/search",
                params: {
                  query: String(query || "").trim(),
                  selectedAddress: selectedAddress
                    ? JSON.stringify(selectedAddress)
                    : null,
                },
              });
            }}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleSearchIconPress}
            style={styles.searchIcon}
          >
            <Icon name="search" size={24} color="#4EA0B7" />
          </TouchableOpacity>
        </View>

        {chefFavorite.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("favoriteList")}</Text>
              <TouchableOpacity onPress={() => router.push("/screen/favorite")}>
                <Text style={{ color: "#4EA0B7", fontSize: 14 }}>
                  {t("seeAll")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ minHeight: 200 }}>
              {loadingFavorite ? (
                <ActivityIndicator style={{ alignSelf: 'center' }} size={'large'} color={'white'} />
              ) : (
                (chefFavorite.length > 0) && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 30 }}
                  >
                    {chefFavorite.map((item, index) => (
                      <View
                        key={index}
                        style={{
                          width: 200,
                          alignItems: "center",
                          marginRight: 20,
                          marginLeft: index === 0 ? 16 : 0,
                        }}
                      >
                        {renderChefFavoriteItem({ item })}
                      </View>
                    ))}
                  </ScrollView>
                )
              )}
            </View>
          </>

        )}




        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("nearbyDishes")}</Text>
          <TouchableOpacity onPress={() => router.push("/screen/allDish")}>
            <Text style={{
              color: "#4EA0B7", fontSize: 14, fontFamily: "nunito-regular",
            }}>
              {t("seeAll")}
            </Text>
          </TouchableOpacity>
        </View>
        {loadingDish ? (
          <View style={{ minHeight: 200 }}>
            <ActivityIndicator style={{ alignSelf: 'center', paddingVertical: 20 }} size={'large'} color={'white'} />
          </View>
        ) : (
          dishes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{
                fontSize: 16, color: '#333', fontFamily: "nunito-regular",
              }}> {t("serviceNotNear")}</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 30 }}
            >
              {dishes.map((item, index) => (
                <View
                  key={index}
                  style={{
                    width: 200,
                    alignItems: "center",
                    marginRight: 20,
                    marginLeft: index === 0 ? 16 : 0,
                  }}
                >
                  {renderDishItem({ item })}
                </View>
              ))}
            </ScrollView>
          )
        )}
        {/* </View> */}




        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("nearbyChefs")}</Text>
          <TouchableOpacity onPress={() => router.push("/screen/allChef")}>
            <Text style={{ color: "#4EA0B7", fontSize: 14, fontFamily: "nunito-regular", }}>
              {t("seeAll")}
            </Text>
          </TouchableOpacity>
        </View>
        {loadingChef ? (
          <ActivityIndicator style={{ alignSelf: 'center', paddingVertical: 20 }} size={'large'} color={'white'} />
        ) : (
          chef.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 16, color: '#333',fontFamily: "nunito-regular", }}> {t("serviceNotNear")}</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 30 }}
            >
                {
                chef.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      width: 200,
                      alignItems: "center",
                      marginRight: 20,
                      marginLeft: index === 0 ? 16 : 0,
                    }}
                  >
                    {renderChefItem({ item })}
                  </View>
                ))
              }
            </ScrollView>
          ))}

      </ScrollView>
      <TouchableOpacity style={styles.chatbotIcon} onPress={toggleChat}>
        <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
      </TouchableOpacity>

      {isChatVisible && (
        <View style={styles.chatOverlay}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#A9411D",
              padding: 20,
              alignItems: "center",
            }}
          >
            <Image
              source={require("../../assets/images/logo.png")}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: "#EBE5DD",
              }}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                marginLeft: 15,
                fontFamily: "nunito-regular",
              }}
            >
              VietChef Chatbot
            </Text>
            <TouchableOpacity
              style={styles.closeChatButton}
              onPress={toggleChat}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <CustomChat
            messages={messages}
            onSendMessage={handleSend}
            callApi={handleChatbot}
            onContactAdmin={() => router.push("/screen/helpCentre")}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    backgroundColor: "#FFF8EF",
    borderColor: "#ddd",
    borderWidth: 2,
    height: 60,
    borderRadius: 100,
    padding: 20,
    fontSize: 16,
    paddingRight: 50,
    fontFamily: "nunito-regular",
  },
  searchIcon: {
    position: "absolute",
    right: 26,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: 200,
    position: "relative",
    marginTop: 20,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: "#FFF",
    overflow: "hidden",
    marginBottom: 8,
    position: "absolute",
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#FFF",
    marginTop: 70,
    textAlign: "center",
    marginBottom: 5,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    color: "#333",
  },
  notificationIconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -8,
    top: -8,
    backgroundColor: "#A9411D",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "nunito-bold",
  },
  chatbotIcon: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4EA0B7",
    borderRadius: 30,
    padding: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  chatOverlay: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 300,
    height: "60%",
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  closeChatButton: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 20,
    padding: 10,
  },
});
