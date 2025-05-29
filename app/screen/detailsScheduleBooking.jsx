import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import useAxios from '../../config/AXIOS_API'
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, Image, ActivityIndicator } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { commonStyles } from '../../style'
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from "expo-image-picker";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import * as Location from "expo-location";
import { t } from "i18next";
import { AuthContext } from '../../config/AuthContext'


const DetailsBooking = () => {
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const route = useRoute();
  const { bookingId } = route.params;
  const [detail, setDetail] = useState({});
  const [customer, setCustomer] = useState({});
  const [images, setImages] = useState([]);
  const { showModal } = useCommonNoification();
  const axiosInstanceForm = useAxiosFormData();
  const router = useRouter();
  const { user } = useContext(AuthContext);


  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/bookings/booking-details/${bookingId}`
      );
      if (response.status === 200) {
        setDetail(response.data);
        setCustomer(response.data.booking.customer);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.fetchBookingFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 2) {
      showModal(t("modal.warning"), t("errors.maxImages"), "Warning");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 2,
    });

    if (!result.canceled) {
      const selected = result.assets.map((asset) => ({
        id: Date.now() + Math.random(),
        imageUrl: asset.uri,
        entityType: "checkout",
        entityId: detail.id,
      }));

      setImages((prev) => {
        const remainingSlots = 2 - prev.length;
        if (remainingSlots <= 0) {
          showModal(
            t("modal.warning"),
            t("errors.maxImages"),
            "Warning"
          );
          return prev;
        }

        const limitedNewImages = selected.slice(0, remainingSlots);
        return [...prev, ...limitedNewImages];
      });
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      showModal(
        t("modal.warning"),
        t("errors.cameraPermissionDenied"),
        "Warning"
      );
      return;
    }

    if (images.length >= 2) {
      showModal(t("modal.warning"), t("errors.maxImages"), "Warning");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      const photo = {
        id: Date.now() + Math.random(),
        imageUrl: result.assets[0].uri,
        entityType: "checkout",
        entityId: detail.id,
      };
      setImages((prev) => [...prev, photo]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    setLoading(true);

    images.forEach((img, index) => {
      const uriParts = img.imageUrl.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("files", {
        uri: img.imageUrl,
        name: `photo_${index}.${fileType}`,
        type: `image/${fileType}`,
      });
    });
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("modal.error"), t("errors.locationPermissionDenied"));
        return null;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      // const response = await axiosInstanceForm.put(`/bookings/booking-details/${detail.id}/complete-chef`, formData);
      const response = await axiosInstanceForm.put(
        `/bookings/booking-details/${detail.id}/complete-chef`,
        formData,
        {
          params: {
            chefLat: currentLocation.coords.latitude,
            chefLng: currentLocation.coords.longitude,
          },
        }
      );

      console.log(response.status);
      if (response.status === 200 || response.status === 204) {
        showModal(t("modal.success"), t("checkoutSuccess"));
        fetchBooking();
      }
    } catch (error) {
      console.log(error.response?.data);
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.checkoutFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    console.log(customer)
    router.push({
      pathname: "/screen/message",
      params: {
        contact: JSON.stringify({
          id: customer?.username,
          name: customer?.fullName,
          avatar: customer?.avatarUrl,
        }),
      },
    });
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t('detailsOrder')} />
      <ScrollView
        style={commonStyles.containerContent}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View key={detail.id} style={styles.itemContainer}>
          <View style={{ gap: 3 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>
                <Text style={styles.itemContentLabel}>{t("name")}: </Text>
                <Text style={{ fontFamily: "nunito-bold", fontSize: 16 }}>
                  {customer?.fullName}
                </Text>
              </Text>
              <TouchableOpacity onPress={() => handleChat()}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={30}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            <Text>
              <Text style={styles.itemContentLabel}>{t("phone")}: </Text>
              <Text style={styles.itemContent}>{customer?.phone}</Text>
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>
                <Text style={styles.itemContentLabel}>{t('sessionDate')}: </Text>
                <Text style={styles.itemContent}>{detail.sessionDate}</Text>
              </Text>
            </View>
            <Text>
              <Text style={styles.itemContentLabel}>{t('location')}: </Text>
              <Text style={styles.itemContent}>{detail.location}</Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>{t('guest')}: </Text>
              <Text style={styles.itemContent}>
                {detail.booking?.guestCount}
              </Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>{t('time')}: </Text>
              <Text style={styles.itemContent}>{detail.startTime}</Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>{t('timeToGo')}: </Text>
              <Text style={styles.itemContent}>{detail.timeBeginTravel}</Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>{t('cookingStartTime')}: </Text>
              <Text style={styles.itemContent}>{detail.timeBeginCook}</Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>{t('prepareIngredients')}: </Text>
              <Text style={styles.itemContent}>
                {detail.chefBringIngredients ? t('yes') : t('no')}
              </Text>
            </Text>
            {/* <Text> */}
            {/* <Text style={styles.itemContentLabel}>Received: </Text> */}
            {/* </Text> */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              {/* <Text style={{ fontSize: 16, fontFamily: "nunito-bold" }}>
                {t('received')}: ${detail.totalChefFeePrice}
              </Text> */}
              <Text style={{ fontFamily: "nunito-bold", fontSize: 18 }}>
                {t('total')}: ${detail.totalPrice}
              </Text>
            </View>
          </View>

          {/* <View
                        key={detail.id}
                        style={{ borderWidth: 0.5, borderBottomColor: "#333", borderRadius: 6, paddingHorizontal: 8, marginVertical: 10 }}> */}
        </View>

        <View style={styles.itemContainer}>
          <View>
            <Text>
              <Text style={styles.itemContentLabel}>{t("dishes")}: </Text>
              {detail.dishes?.length === 0 && (
                <Text style={styles.itemContent}>{t("notYet")}</Text>
              )}
            </Text>
            {detail.dishes &&
              detail.dishes.map((dish) => (
                <View
                  key={dish.id}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={{ uri: dish.dish.imageUrl }}
                    style={{
                      width: 40,
                      height: 40,
                      marginRight: 10,
                      borderRadius: 10,
                    }}
                  />
                  <View>
                    <Text style={{ fontSize: 15, fontFamily: "nunito-regular" }}>{dish.dish.name}</Text>
                    {!dish.notes && (
                      <Text style={{ fontSize: 13, color: "#333", fontFamily: "nunito-regular" }}>
                        {dish.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
          </View>
        </View>
        {(detail.status === "IN_PROGRESS" ||
          detail.status === "WAITING_FOR_CONFIRMATION" ||
          detail.status === "COMPLETED") && (
            <View style={styles.itemContainer}>
              <Text
                style={{ fontSize: 16, fontFamily: "nunito-bold", marginBottom: 10 }}
              >
                {t('uploadCheckoutReceipts')}
              </Text>

              {(detail.status === "WAITING_FOR_CONFIRMATION" ||
  (detail.status === "COMPLETED" && detail.images)) ? (
  detail.images.length > 0 ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {detail.images.map((img) => (
        <View
          key={img.id}
          style={{ marginRight: 10, position: "relative" }}
        >
          <Image
            source={{ uri: img.imageUrl }}
            style={{ width: 100, height: 100, borderRadius: 8 }}
          />
        </View>
      ))}
    </ScrollView>
  ) : (
    <View
      style={{
        // width: screenWidth,
        // height: 100,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ textAlign: 'center', color: 'gray' }}>
        {t('noImagesAvailable')}
      </Text>
    </View>
  )
) : (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {images.map((img) => (
      <View
        key={img.id}
        style={{ marginRight: 10, position: "relative" }}
      >
        <Image
          source={{ uri: img.imageUrl }}
          style={{ width: 100, height: 100, borderRadius: 8 }}
        />
        <TouchableOpacity
          onPress={() =>
            setImages(images.filter((i) => i.id !== img.id))
          }
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 2,
          }}
        >
          <Ionicons name="close-circle" size={20} color="red" />
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
)}
              {detail.status === "IN_PROGRESS" && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 15,
                  }}
                >
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                      marginRight: 5,
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    <Ionicons name="images-outline" size={24} color="#333" />
                    <Text style={{ marginTop: 5, fontFamily: "nunito-regular" }}>{t('chooseImage')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={takePhoto}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                      marginLeft: 5,
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    <Ionicons name="camera-outline" size={24} color="#333" />
                    <Text style={{ marginTop: 5, fontFamily: "nunito-regular" }}>{t('takePhoto')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* </View> */}
              {detail.status === "IN_PROGRESS" && (
                <View>
                  <TouchableOpacity
                    style={{
                      marginVertical: 10,
                      backgroundColor: "#A64B2A",
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      elevation: 5,
                    }}
                    onPress={() => handleSubmit()}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontFamily: "nunito-bold",
                          fontSize: 16,
                        }}
                      >
                        {t('complete')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        {/* </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    gap: 5,
    backgroundColor: "#F9F5F0",
    borderColor: "#333",
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
  },
  detailItem: {
    gap: 5,
    // backgroundColor: "#FFFFFF",
    // borderBottomWidth: 1,
    borderColor: "#DDD",
    // borderRadius: 5,
    // padding: 10,
    marginVertical: 10,
  },
  itemContentLabel: {
    fontSize: 15,
    fontFamily: "nunito-bold",
  },
  itemContent: {
    fontSize: 14,
    fontFamily: "nunito-regular"
  },
});

export default DetailsBooking;
