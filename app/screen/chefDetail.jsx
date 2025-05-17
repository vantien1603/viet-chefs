import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router, useLocalSearchParams, useSegments } from "expo-router";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { Tooltip } from "react-native-elements";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useCommonNoification } from "../../context/commonNoti";
import { commonStyles } from "../../style";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import * as SecureStore from "expo-secure-store";


const ChefDetail = () => {
  const [expandedBio, setExpandedBio] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [chefs, setChefs] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { chefId } = useLocalSearchParams();
  const modalizeRef = useRef(null);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const navigation = useNavigation();
  const { setChefId, setRouteBefore, clearSelection } = useSelectedItems();
  const [modalKey, setModalKey] = useState(1);
  const segment = useSegments();



  useEffect(() => {
    fetchDishes();
    fetchChefById();
  }, []);

  const fetchChefById = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/chefs/${chefId}`);
      if (response.status === 200) {
        setChefs(response.data);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Yêu cầu đã bị huỷ do không có mạng.");
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình tải thông tin đầu bếp", "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDishes = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/dishes?chefId=${chefId}`);
      if (response.status === 200) {
        setDishes(response.data.content);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Yêu cầu đã bị huỷ do không có mạng.");
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình tải danh sách món ăn", "Failed");

    } finally {
      setIsLoading(false);
    }
  };

  const onOpenModal = () => {
    setModalKey(modalKey + 1);
    setTimeout(() => {
      modalizeRef.current?.open();
    }, 100)
  };
  const toggleBio = () => setExpandedBio(!expandedBio);
  const toggleDesc = () => setExpandedDesc(!expandedDesc);
  const toggleDetails = () => setShowMoreDetails(!showMoreDetails);

  const DishCard = React.memo(({ dish, onPress }) => (
    <TouchableOpacity style={styles.dishCard} onPress={onPress}>
      <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.dishName}>{dish.name}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.dishDescription}>{dish.description}</Text>
    </TouchableOpacity>
  ));

  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <Header title={t("chefInfo")} />
      <FlatList
        ListHeaderComponent={
          <>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f5a623" />
                <Text style={styles.loadingText}>{t("loadingData")}</Text>
              </View>
            ) : (
              chefs && (
                <View style={styles.profileContainer}>
                  <View style={styles.header}>
                    <Image
                      source={
                        chefs?.user?.avatarUrl === "default"
                          ? require("../../assets/images/avatar.png")
                          : { uri: chefs?.user?.avatarUrl }
                      }
                      style={styles.avatar}
                    />
                    <View style={styles.textContainer}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.name}>{chefs?.user?.fullName}</Text>
                        <TouchableOpacity style={{ position: 'absolute', right: 10 }} onPress={() => navigation.navigate("screen/message", {
                          contact: {
                            id: chefs?.user?.id,
                            name: chefs?.user?.fullName,
                            avatar: chefs?.user?.avatarUrl
                          }
                        })}>
                          <Ionicons name="chatbubble-ellipses-outline" size={30} color="black" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.specialty}>
                        {chefs?.specialization}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={styles.starContainer}>
                          {Array(5).fill().map((_, i) => {
                            const rating = chefs?.averageRating || 0;
                            let iconName = "star";
                            let color = "#ccc";

                            if (i < Math.floor(rating)) {
                              color = "#f5a623";
                            } else if (i < rating) {
                              iconName = "star-half-full"; // Hoặc "star-half-o" tùy font
                              color = "#f5a623";
                            }

                            return (
                              <Icon
                                key={i}
                                name={iconName}
                                size={20}
                                color={color}
                              />
                            );
                          })}

                        </View>
                        <Text style={[styles.value, { color: 'orange' }]}>${chefs?.price}/hour</Text>
                      </View>

                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text
                      style={styles.value}
                      numberOfLines={expandedBio ? undefined : 3}
                    >
                      {chefs?.bio || t("noInformation")}
                    </Text>
                    {chefs?.bio && chefs.bio.length > 100 && (
                      <TouchableOpacity onPress={toggleBio}>
                        <Text style={styles.showMore}>
                          {expandedBio ? t("seeLess") : t("seeMore")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.section}>
                    {/* <Text style={styles.label}>{t("description")}:</Text> */}
                    <Text
                      style={styles.value}
                      numberOfLines={expandedDesc ? undefined : 3}
                    >
                      {chefs?.description || t("noInformation")}
                    </Text>
                    {chefs?.description && chefs.description.length > 100 && (
                      <TouchableOpacity onPress={toggleDesc}>
                        <Text style={styles.showMore}>
                          {expandedDesc ? t("seeLess") : t("seeMore")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showMoreDetails && (
                    <>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("address")}: </Text>
                        <Text style={styles.value}>{chefs?.address}</Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>Email: </Text>
                        <Text style={styles.value}>{chefs?.user?.email}</Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("phone")}: </Text>
                        <Text style={styles.value}>{chefs?.user?.phone}</Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("gender")}: </Text>
                        <Text style={styles.value}>{chefs?.user?.gender}</Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("dob")}: </Text>
                        <Text style={styles.value}>{chefs?.user?.dob}</Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("country")}: </Text>
                        <Text style={styles.value}>{chefs?.country}</Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("experienceYears")}: </Text>
                        <Text style={styles.value}>
                          {chefs?.yearsOfExperience || t("noInformation")}
                        </Text>
                      </Text>
                      <Text style={styles.section}>
                        <Text style={styles.label}>{t("maxServingSize")}: </Text>
                        <Text style={styles.value}>
                          {chefs?.maxServingSize} {t("people")}
                        </Text>
                      </Text>
                    </>
                  )}

                  <TouchableOpacity onPress={toggleDetails}>
                    <Text style={styles.showMore}>
                      {showMoreDetails ? t("seeLess") : t("seeMore")}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={onOpenModal}
                    >
                      <Text style={styles.buttonText}>{t("bookNow")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() =>
                        router.push({
                          pathname: "/screen/reviewsChef",
                          params: {
                            chefId: chefId,
                            chefName: chefs?.user?.fullName,
                          },
                        })
                      }
                    >
                      <Text style={styles.buttonText}>{t("reviews")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("featuredDishes")}</Text>
              <TouchableOpacity
                style={styles.viewAllContainer}
                onPress={() => router.push("/screen/allDish")}
              >
                <Icon name="restaurant-outline" size={16} color="#b0532c" />
                <Text style={styles.viewAll}>{t("seeAllDishes")}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        data={dishes.slice(0, 4)}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <DishCard
            dish={item}
            onPress={() =>
              router.push({
                pathname: "/screen/dishDetails",
                params: { dishId: item.id, chefId },
              })
            }
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.dishContainer}
        ListFooterComponent={<View style={{ height: 20 }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f5a623" />
              <Text style={styles.loadingText}>{t("loadingFood")}</Text>
            </View>
          ) : null
        }
      />

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        key={modalKey}
      >
        <View style={styles.modalContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                {t("selectBookingType")}
              </Text>
            </View>

            <View style={{ paddingLeft: 8 }}>
              <Tooltip
                popover={
                  <View style={{ padding: 4 }}>
                    <Text style={{ marginBottom: 4 }}>
                      Choose the type of booking you want.
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold' }}>Regular booking:</Text> Choose dishes or menu for 1 meal according to your schedule.
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: 'bold' }}>Long-term booking:</Text> Experience the service on many selected days. You can flexibly change dishes/menu before the booking date.
                    </Text>
                  </View>
                }
                backgroundColor="#fff"
                width={300}
                height={220}
                containerStyle={{
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  borderRadius: 8,
                }}
                pointerColor="#fff"
                overlayColor="transparent"
                skipAndroidStatusBar
              >
                <AntDesign name="questioncircleo" size={22} color="black" />
              </Tooltip>
            </View>
          </View>


          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              modalizeRef.current?.close();
              clearSelection();
              setChefId(chefId);
              setRouteBefore(segment);
              SecureStore.setItem("firstChef", chefId);
              router.replace("/screen/selectFood");
            }}
          >
            <View>
              <Text style={styles.modalButtonText}>{t("regularBooking")}</Text>
              {/* <Text style={styles.modalButtonDesc}>
                {t("regularBookingDescription")}
              </Text> */}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              modalizeRef.current?.close();
              clearSelection();
              setChefId(chefId);
              // setRouteBefore(segment);
              SecureStore.setItem("firstChef", chefId);
              router.replace("/screen/longTermBooking")
            }}
          >
            <View>
              <Text style={styles.modalButtonText}>{t("longTermBooking")}</Text>
              {/* <Text style={styles.modalButtonDesc}>
                {t("longTermBookingDescription")}
              </Text> */}
            </View>
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    padding: 20,
    backgroundColor: "#F9F5F0",
    borderRadius: 16,
    // margin: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#eee",
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  specialty: {
    fontSize: 16,
    color: "#777",
    marginVertical: 4,
  },
  starContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#999",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  showMore: {
    fontSize: 14,
    color: "#b0532c",
    marginTop: 5,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#f5a623",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionHeader: {
    borderTopColor: "#D1D1D1",
    borderTopWidth: 0.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAll: {
    fontSize: 14,
    color: "#b0532c",
    marginLeft: 5,
  },
  dishContainer: {
    paddingHorizontal: 16,
  },
  dishCard: {
    backgroundColor: "#b0532c",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
    marginHorizontal: "1%",
  },
  dishImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  dishName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  dishDescription: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  modalContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#f5a623",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  modalButtonDesc: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    marginTop: 5,
    opacity: 0.8,
  },
  modalStyle: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: "#b0532c",
    width: 40,
    height: 5,
    borderRadius: 5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
});

export default ChefDetail;
