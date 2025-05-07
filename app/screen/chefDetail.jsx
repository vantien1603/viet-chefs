import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";

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

  // Gộp API calls
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dishesResponse, chefResponse] = await Promise.all([
          axiosInstance.get(`/dishes?chefId=${chefId}`, { timeout: 5000 }),
          axiosInstance.get(`/chefs/${chefId}`, { timeout: 5000 }),
        ]);
        setDishes(dishesResponse.data.content);
        setChefs(chefResponse.data);
      } catch (error) {
        console.log("e", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (chefId) fetchData();
  }, [chefId]);

  const onOpenModal = () => {
    modalizeRef.current?.open();
    Toast.show({
      type: "success",
      text1: "Mở tùy chọn",
      text2: "Chọn loại đặt chỗ phù hợp với bạn",
    });
  };

  const handleBack = () => {
    router.push("/(tabs)/home");
  };

  const toggleBio = () => setExpandedBio(!expandedBio);
  const toggleDesc = () => setExpandedDesc(!expandedDesc);
  const toggleDetails = () => setShowMoreDetails(!showMoreDetails);

  // Component con tối ưu với React.memo
  const DishCard = React.memo(({ dish, onPress }) => (
    <TouchableOpacity style={styles.dishCard} onPress={onPress}>
      <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
      <Text style={styles.dishName}>{dish.name}</Text>
      <Text style={styles.dishDescription}>{dish.description}</Text>
    </TouchableOpacity>
  ));

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#EBE5DD" }}>
      <Header title={t("chefInfo")} onLeftPress={handleBack}/>
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
                      <Text style={styles.name}>{chefs?.user?.fullName}</Text>
                      <Text style={styles.specialty}>
                        {chefs?.specialization}
                      </Text>
                      <View style={styles.starContainer}>
                        {Array(5).fill().map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={20}
                              color={
                                i < Math.floor(chefs?.averageRating || 0)
                                  ? "#f5a623"
                                  : "#CCCCCC"
                              }
                            />
                          ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>{t("bio")}:</Text>
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
                    <Text style={styles.label}>{t("description")}:</Text>
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
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("address")}:</Text>
                        <Text style={styles.value}>{chefs?.address}</Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{chefs?.user?.email}</Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("phone")}:</Text>
                        <Text style={styles.value}>{chefs?.user?.phone}</Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("gender")}:</Text>
                        <Text style={styles.value}>{chefs?.user?.gender}</Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("dob")}:</Text>
                        <Text style={styles.value}>{chefs?.user?.dob}</Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("country")}:</Text>
                        <Text style={styles.value}>{chefs?.country}</Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>
                          {t("experienceYears")}:
                        </Text>
                        <Text style={styles.value}>
                          {chefs?.yearsOfExperience || t("noInformation")}
                        </Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("maxServingSize")}:</Text>
                        <Text style={styles.value}>
                          {chefs?.maxServingSize} {t("people")}
                        </Text>
                      </View>
                      <View style={styles.section}>
                        <Text style={styles.label}>{t("pricePerHour")}:</Text>
                        <Text style={styles.value}>${chefs?.price}</Text>
                      </View>
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
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t("selectBookingType")}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              modalizeRef.current?.close();
              router.push({
                pathname: "/screen/selectFood",
                params: { chefId: chefId },
              });
            }}
          >
            <View>
              <Text style={styles.modalButtonText}>{t("regularBooking")}</Text>
              <Text style={styles.modalButtonDesc}>
                {t("regularBookingDescription")}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              modalizeRef.current?.close();
              router.push({
                pathname: "/screen/longTermBooking",
                params: { chefId: chefId },
              });
            }}
          >
            <View>
              <Text style={styles.modalButtonText}>{t("longTermBooking")}</Text>
              <Text style={styles.modalButtonDesc}>
                {t("longTermBookingDescription")}
              </Text>
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
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
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
