import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../../config/AXIOS_API";
import { router, useLocalSearchParams } from "expo-router";
import { t } from "i18next";
import { AuthContext } from "../../config/AuthContext";
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker";
import { commonStyles } from "../../style";
import { useCommonNoification } from "../../context/commonNoti";
import { Platform } from "react-native";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useConfirmModal } from "../../context/commonConfirm";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";

const DishDetails = () => {
  const navigation = useNavigation();
  const { dishId, dishName, menuId, chefId } = useLocalSearchParams();
  const [dishesName, setDishesName] = useState({ dishName });
  const [dish, setDish] = useState({});
  const [oldDish, setOldDish] = useState({});
  const [chef, setChef] = useState(null);
  const axiosInstance = useAxios();
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [dishNotes, setDishNotes] = useState({});
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [foodType, setFoodType] = useState([]);
  const [image, setImage] = useState(null);
  const { showModal } = useCommonNoification();
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();
  const axiosInstanceForm = useAxiosFormData();

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
    const fetchDishDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/dishes/${dishId}`);
        setDish(response.data);
        setDishesName(response.data.name)
        setOldDish(response.data);
        if (menuId && response.data.id && !selectedDishes.some((item) => item.id === response.data.id)) {
          setSelectedDishes([
            {
              id: response.data.id,
              name: response.data.name || dishName,
              imageUrl: response.data.imageUrl,
            },
          ]);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Yêu cầu đã bị huỷ do không có mạng.");
          return;
        }
        showModal("Error", "Có lỗi xảy ra trong quá trình tải món ăn", "Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchDishDetails();
  }, [dishId, dishName, menuId]);

  useEffect(() => {
    const fetchChefDetails = async () => {
      const chefIdToFetch = dish.chefId || chefId || user.chefId;
      if (chefIdToFetch) {
        try {
          const response = await axiosInstance.get(`/chefs/${chefIdToFetch}`);
          setChef(response.data);
          // console.log("chef details", response.data);
        } catch (error) {
          console.error("Error fetching chef details:", error);
        }
      }
    };
    fetchChefDetails();
  }, [dish.chefId, chefId]);

  const handleAddItem = () => {
    if (dish.id && !selectedDishes.some((item) => item.id === dish.id)) {
      setSelectedDishes((prev) => [
        ...prev,
        {
          id: dish.id,
          name: dish.name || dishName,
          imageUrl: dish.imageUrl,
        },
      ]);
    }
  };

  const handleBooking = () => {
    router.push({
      pathname: "/screen/booking",
      params: {
        chefId: dish.chefId?.toString() || chefId,
        selectedDishes: JSON.stringify(selectedDishes),
        dishNotes: JSON.stringify(dishNotes),
        latestDishId: dish.id?.toString(),
      },
    });
  };

  const handleBack = () => {
    if (menuId) {
      router.push({
        pathname: "/screen/menuDetails",
        params: {
          menuId,
          menuName,
          chefId,
          selectedDishes: JSON.stringify(selectedDishes),
          latestDishId: dish.id?.toString(),
        },
      });
    } else {
      navigation.goBack();
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
    console.log("ccc")
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
      formData.append('foodTypeId', dish.foodTypeId.toString());
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
      }

    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
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
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error.response?.data || error.message);
      showModal("Error", "Dish delete failed.");
    } finally {
      setLoading(false);
    }
  }



  return (

    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.containerContent} showsVerticalScrollIndicator={false}>
        {/* <View style={styles.imageContainer}>
          <Image
            source={{ uri: dish?.imageUrl }}
            style={styles.dishImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View> */}
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
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* <View style={styles.header}> */}
        {isEditing ? (
          <TextInput
            style={styles.inputEditing}
            value={dishesName}
            onChangeText={setDishesName}
            placeholder="Tên món ăn"
          />
        ) : (
          <Text style={styles.dishName}>{dish.name || dishName}</Text>
        )}
        {/* </View> */}


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



        {/* <View style={styles.detailsContainer}> */}
        <View style={styles.detailItem}>
          {isEditing ? (
            <Dropdown
              data={foodType}
              labelField="label"
              valueField="value"
              value={dish.foodTypeId.toString()}
              onChange={item => setDish(prev => ({
                ...prev,
                foodTypeId: item,
              }))}
              placeholder="Select Food Type"
              style={styles.dropdown}
              selectedTextStyle={styles.selectedText}
              containerStyle={styles.dropdownContainer}
            />
          ) : (
            <>
              <Ionicons name="fast-food-outline" size={20} color="black" />
              <Text style={styles.detailText}>Food type: {foodType.find(ft => parseInt(ft.value) === dish.foodTypeId)?.label || ""}</Text>
            </>

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
              onChangeText={(text) => setDish(prev => ({ ...prev, serviceType: text }))}
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
        {/* </View> */}

        {/* <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="fast-food-outline" size={20} color="black" />
            <Text style={styles.detailText}>Food type: {foodType.find(ft => parseInt(ft.value) === dish.foodTypeId)?.label || ""}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="restaurant-outline" size={20} color="#555" />
            <Text style={styles.detailText}>{t("cuisine")}: {dish.cuisineType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="home-outline" size={20} color="#555" />
            <Text style={styles.detailText}>{t("type")}: {dish.serviceType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color="#555" />
            <Text style={styles.detailText}>
              {t("cookTime")}: {dish.cookTime} {t("minutes")}
            </Text>
          </View>
        </View> */}

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
        !menuId && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={selectedDishes.length > 0 ? handleBooking : handleAddItem}
            >
              <Text style={styles.actionButtonText}>
                {selectedDishes.length > 0
                  ? `Booking - ${selectedDishes.length} item${selectedDishes.length > 1 ? "s" : ""}`
                  : "Add Item"}
              </Text>
            </TouchableOpacity>
          </View>
        )
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
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
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
    paddingHorizontal: 16,
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
    // zIndex:-1
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
    // marginLeft: 10,
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