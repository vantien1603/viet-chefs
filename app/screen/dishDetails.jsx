import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { router, useFocusEffect, useLocalSearchParams, useSegments } from "expo-router";
import { t } from "i18next";
import { AuthContext } from "../../config/AuthContext";
import { MultiSelect } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker";
import { commonStyles } from "../../style";
import { useCommonNoification } from "../../context/commonNoti";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useConfirmModal } from "../../context/commonConfirm";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import * as SecureStore from "expo-secure-store";

const DishDetails = () => {
  const { dishId } = useLocalSearchParams();
  const {
    extraDishIds, selectedDishes, selectedMenu, setSelectedDishes, selectedDay, setExtraDishIds,
    setChefId, isLoop, setIsLoop, clearSelection,
    isLong,
    setRouteBefore
  } = useSelectedItems();

  const [dishesName, setDishesName] = useState("");
  const [dish, setDish] = useState({});
  const [oldDish, setOldDish] = useState({});
  const [chef, setChef] = useState(null);
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [foodType, setFoodType] = useState([]);
  const [image, setImage] = useState(null);
  const { showModal } = useCommonNoification();
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();
  const axiosInstanceForm = useAxiosFormData();
  const segment = useSegments();

  console.log(dishId);

  useFocusEffect(
    useCallback(() => {
      console.log(isLoop);
      if (!isLoop) clearSelection();
    }, [])
  );

  useEffect(() => {
    setLoading(true);
    const fetchFoodTypes = async () => {
      try {
        const response = await axiosInstance.get("/food-types");
        const formattedFoodTypes = response.data.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        }));
        setFoodType(formattedFoodTypes);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          console.log("Yêu cầu đã bị huỷ do không có mạng.");
          return;
        }
        showModal("Error", "Có lỗi xảy ra trong quá trình tải loại món ăn", "Failed");

      } finally {
        setLoading(false);
      }
    }
    fetchFoodTypes();
  }, [])

  useEffect(() => {
    fetchDishDetails();
  }, []);

  const fetchDishDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/dishes/${dishId}`);
      setDish(response.data);
      setDishesName(response.data.name)
      setOldDish(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        console.log("Yêu cầu đã bị huỷ do không có mạng.");
        return;
      }
      console.log(error.response.data.message)
      showModal("Error", "Có lỗi xảy ra trong quá trình tải món ăn", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchChefDetails = async () => {
      const chefIdToFetch = dish?.chef?.id || user?.chefId;
      if (chefIdToFetch) {
        try {
          const response = await axiosInstance.get(`/chefs/${chefIdToFetch}`);
          setChef(response.data);
        } catch (error) {
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(error)) {
            console.log("Yêu cầu đã bị huỷ do không có mạng.");
            return;
          }
          showModal("Error", "Có lỗi xảy ra trong quá trình tải thông tin đầu bếp", "Failed");
        }
      }
    };
    fetchChefDetails();
  }, [dish?.chef?.id]);

  const handleBack = () => {
    if (isLoop) {
      console.log("roi vo day", isLoop);
      setIsLoop(false);
      isLong ? router.replace("/screen/chooseFoodForLongterm") : router.replace("/screen/selectFood");
    } else {
      setIsLoop(false);
      router.back();
    }
  }

  const handleBooking = () => {
    setChefId(dish.chef?.id);
    // if (!selectedMenu) {
    //   if (!Object.values(selectedDishes).some((item) => item.id === dish.id)) {
    //     console.log("khong trung")
    //     setSelectedDishes((prev) => ({
    //       ...prev,
    //       [dish.id]: {
    //         id: dish.id,
    //         name: dish.name,
    //         imageUrl: dish.imageUrl,
    //         description: dish.description
    //       },
    //     }));
    //   }
    // } else {
    //   if (!Object.values(extraDishIds).some((item) => item.id === dish.id)) {
    //     setExtraDishIds((prev) => ({
    //       ...prev,
    //       [dish.id]: {
    //         id: dish.id,
    //         name: dish.name,
    //         imageUrl: dish.imageUrl,
    //         description: dish.description
    //       },
    //     }));
    //   }
    // }

    if (!isLong) {
      if (!selectedMenu) {
        if (!Object.values(selectedDishes).some((item) => item.id === dish.id)) {
          setSelectedDishes((prev) => ({
            ...prev,
            [dish.id]: {
              id: dish.id,
              name: dish.name,
              imageUrl: dish.imageUrl,
              description: dish.description
            },
          }));
        }
      } else {
        if (!Object.values(extraDishIds).some((item) => item.id === dish.id)) {
          setExtraDishIds((prev) => ({
            ...prev,
            [dish.id]: {
              id: dish.id,
              name: dish.name,
              imageUrl: dish.imageUrl,
              description: dish.description
            },
          }));
        }
      }
    } else {
      if (!selectedMenu) {
        if (!Object.values(selectedDishes[selectedDay] || {}).some((item) => item.id === dish.id)) {
          setSelectedDishes((prev) => ({
            ...prev,
            [selectedDay]: {
              ...(prev[selectedDay] || {}),
              [dish.id]: {
                id: dish.id,
                name: dish.name,
                imageUrl: dish.imageUrl,
                description: dish.description
              },
            }
          }));
        }
      } else {
        if (!Object.values(extraDishIds[selectedDay] || {}).some((item) => item.id === dish.id)) {
          setExtraDishIds((prev) => ({
            ...prev,
            [selectedDay]: {
              ...(prev[selectedDay] || {}),
              [dish.id]: {
                id: dish.id,
                name: dish.name,
                imageUrl: dish.imageUrl,
                description: dish.description
              },
            }
          }));
        }
      }
    }

    setRouteBefore(segment);
    if (!isLoop) {
      SecureStore.setItem("firstDish", dishId);
      router.replace("/screen/selectFood");
    } else {
      setIsLoop(false);
      isLong ? router.replace("/screen/chooseFoodForLongterm") : router.replace("/screen/selectFood");
    }
  };

  const pickImage = async () => {
    console.log('cc')
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCancel = () => {
    if (oldDish) {
      setDish(oldDish);
      setDishesName(oldDish.name);
      setImage(null);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('chefId', user?.chefId);
      formData.append('foodTypeId', dish.foodTypeId);
      formData.append('dishName', dishesName);
      formData.append('description', dish.description);
      formData.append('cuisineType', dish.cuisineType);
      formData.append('serviceType', dish.serviceType);
      formData.append('estimatedCookGroup', dish.estimatedCookGroup);
      formData.append('cookTime', dish.cookTime);
      formData.append('basePrice', dish.basePrice);

      if (image) {
        const filename = image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";
        formData.append("file", {
          uri: image,
          name: filename,
          type,
        });
      }

      const response = await axiosInstanceForm.put(`/dishes/${dish.id}`, formData);
      if (response.status === 200) {
        showModal("Success", "Update dishes successfully");
        fetchDishDetails();
      }
    } catch (error) {
      console.log(error);
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      if (error.response.status === 413) {
        showModal("Error", "Dung lượng ảnh quá lớn", 'Failed');
        return;
      }
      showModal("Error", error.response.data.message, 'Failed');
    } finally {
      setIsEditing(false);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/dishes/${dish.id}`);
      if (response.status === 200 || response.status === 204) {
        showModal("Success", "Delete dish delete successfully.");
        router.back();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình xóa món ăn", "Failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.containerContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {isEditing ? (
            <TouchableOpacity onPress={() => pickImage()}>
              <Image
                source={image ? { uri: image } : { uri: dish?.imageUrl }}
                style={styles.dishImage}
                resizeMode="cover"
              />
              <Feather
                name="camera"
                size={32}
                color="white"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -16 }, { translateY: -16 }],
                  opacity: 0.8,
                }}
              />
            </TouchableOpacity>
          ) : (
            <Image
              source={{ uri: dish?.imageUrl }}
              style={styles.dishImage}
              resizeMode="cover"
            />
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ padding: 10 }}>
          {isEditing ? (
            <TextInput
              style={styles.inputEditing}
              value={dishesName}
              onChangeText={(text) => setDishesName(text)}
              placeholder="Tên món ăn"
            />
          ) : (
            <Text style={styles.dishName}>{dish.name}</Text>
          )}


          {isEditing ? (
            <TextInput
              style={styles.textArea}
              value={dish.description}
              onChangeText={(text) => setDish(prev => ({ ...prev, description: text }))}
              placeholder="Mô tả món ăn"
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.description}>{dish.description}</Text>
          )}
          {/* lat qua chef sua cai nay */}
          <View style={{ marginBottom: 12 }}>
            {isEditing ? (
              <MultiSelect
                style={styles.dropdown}
                placeholder="Select Food Types"
                data={foodType}
                labelField="label"
                valueField="value"
                value={dish.foodTypes.map(item => item.id.toString())}
                onChange={(selectedIds) => {
                  const selectedFoodTypes = foodType
                    .filter(ft => selectedIds.includes(ft.value))
                    .map(ft => ({
                      id: ft.value,
                      name: ft.label,
                    }));
                  console.log(selectedFoodTypes)

                  setDish(prev => ({
                    ...prev,
                    foodTypes: selectedFoodTypes,
                  }));
                }}
                renderItem={(item) => {
                  const isInitiallySelected = dish.foodTypes?.some(ft => ft.id.toString() === item.value);
                  console.log(isInitiallySelected)
                  return (
                    <View style={{
                      padding: 10,
                      backgroundColor: isInitiallySelected ? '#F9F5F0' : 'white',
                      borderWidth: 2,
                      borderRadius: 6,
                      borderColor: isInitiallySelected ? '#F8BF40' : 'transparent',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{ color: 'black' }}>{item.label}</Text>
                    </View>
                  );
                }}
                selectedStyle={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 10,
                  color: 'black'
                }}
              />
            ) : (
              <View style={styles.detailItem}>
                <Ionicons name="fast-food-outline" size={20} color="black" />
                <Text style={styles.detailText}>
                  Food type: {dish.foodTypes?.map(ft => ft.name).join(", ")}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.detailItem}>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={dish.cuisineType}
                onChangeText={(text) => {
                  setDish(prev => ({ ...prev, cuisineType: text }))
                }}
              />
            ) : (
              <>
                <Ionicons name="restaurant-outline" size={20} color="#555" />
                <Text style={styles.detailText}>Cuisine: {dish.cuisineType}</Text>
              </>
            )}
          </View>
          <View style={styles.detailItem}>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={dish.serviceType}
                onChangeText={(text) => {
                  setDish(prev => ({ ...prev, serviceType: text }))

                }}
              />
            ) : (<>
              <Ionicons name="home-outline" size={20} color="#555" />
              <Text style={styles.detailText}>Type: {dish.serviceType}</Text>
            </>

            )}
          </View>
          <View style={styles.detailItem}>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={dish.cookTime.toString()}
                // value={dish.cookTime}
                onChangeText={(text) => setDish(prev => ({ ...prev, cookTime: text }))}
              />
            ) : (
              <>
                <Ionicons name="time-outline" size={20} color="#555" />
                <Text style={styles.detailText}>
                  Cook Time: {dish.cookTime} mins
                </Text>
              </>
            )}
          </View>
          {/* thieu cai base price, ti qua chef them vo  */}

          <View style={styles.detailItem}>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={dish.basePrice.toString()}
                // value={dish.cookTime}
                onChangeText={(text) => setDish(prev => ({ ...prev, basePrice: text }))}
              />
            ) : (
              <>
                <Feather name="dollar-sign" size={24} color="black" />
                <Text style={styles.detailText}>
                  Base price: ${dish.basePrice}
                </Text>
              </>
            )}
          </View>
          {user?.roleName != "ROLE_CHEF" && (
            chef && (
              <View style={styles.chefContainer}>
                <Text style={styles.sectionTitle}>{t("chef")}</Text>
                <View style={styles.chefInfo}>
                  <Image
                    source={{
                      uri:
                        chef.user?.avatarUrl && chef.user.avatarUrl !== "default"
                          ? chef.user.avatarUrl
                          : "https://via.placeholder.com/50",
                    }}
                    style={styles.chefAvatar}
                    resizeMode="cover"
                  />
                  <View style={styles.chefText}>
                    <Text style={styles.chefName}>
                      {chef.user?.fullName || t("chef")}
                    </Text>
                    <Text style={styles.chefBio} numberOfLines={2}>
                      {chef.bio || t("noInformation")}
                    </Text>
                  </View>

                </View>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {user?.roleName === "ROLE_CHEF" ? (
        isEditing ? (
          < View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => requireAuthAndNetWork(() => handleSave())}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleCancel()}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          < View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton}
              disabled={loading}
              onPress={() =>
                showConfirm("Delete Dish", "Are you sure you want to delete this dish?", () => requireAuthAndNetWork(handleDelete))
              } >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        )
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBooking}
          >
            <Text style={styles.actionButtonText}>
              Select item
            </Text>
          </TouchableOpacity>
        </View>
      )
      }
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
    marginBottom: 10
  },
  dishImage: {
    width: "100%",
    height: 250,
    borderRadius: 20,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dishName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 8,
  },
  chefContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  chefInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chefAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chefText: {
    flex: 1,
  },
  chefName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  chefBio: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    width: "100%",
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  buttonRow: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  updateButton: {
    backgroundColor: "orange",
    padding: 15,
    borderRadius: 10,
    width: "40%",
    alignItems: "center"
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    width: "40%",
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16
  },
  inputEditing: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  selectedText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownContainer: {
    borderRadius: 10,
    borderColor: '#ccc',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
});
export default DishDetails;
