import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/header";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useCommonNoification } from "../../context/commonNoti";
import { commonStyles } from "../../style";
import { AuthContext } from "../../config/AuthContext";
import { Modalize } from "react-native-modalize";
import useAxios from "../../config/AXIOS_API";
import axios from "axios";
import { Switch } from "react-native";
import { useRouter } from "expo-router";
import { t } from "i18next";

const AddMenu = () => {
  const { showModal } = useCommonNoification();
  const { user } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seletedDishes, setSelectedDishes] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [totalCookTime, setTotalCookTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const axiosInstanceForm = useAxiosFormData();
  const axiosInstance = useAxios();
  const modalizeRef = useRef(null);
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    fetchDishes();
  }, []);

  console.log(dishes.length);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/dishes", {
        params: { chefId: user.chefId },
      });
      setDishes(response.data.content);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        "Có lỗi xảy ra trong quá trình tải danh sách món ăn.",
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxToggle = () => {
    setHasDiscount(!hasDiscount);
  };

  const toggleDishSelection = (dishId) => {
    setSelectedDishes((prevSelectedDishes) => {
      if (prevSelectedDishes.includes(dishId)) {
        return prevSelectedDishes.filter((id) => id !== dishId);
      } else {
        return [...prevSelectedDishes, dishId];
      }
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    const errors = {};

    if (!image) errors.image = t("errors.image");
    if (!name.trim()) errors.name = t("errors.name");
    // if (!description.trim()) errors.description = t("errors.description");
    if (seletedDishes.length <= 0) errors.dishes = t("errors.dishes");

    if (hasDiscount) {
      if (!discountPercentage || isNaN(discountPercentage)) {
        errors.discountPercentage = t("errors.discountPercentageInvalid");
      } else if (discountPercentage <= 0 || discountPercentage > 100) {
        errors.discountPercentage = t("errors.discountPercentageOutOfRange");
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showModal(t("modal.error"), t("errors.failedToAdd"), "Failed");
      console.log("err");
      return;
    }
    console.log("easd")

    setLoading(true);
    const selectedDishPayload = seletedDishes.map((dishId) => ({ dishId }));
    const formData = new FormData();
    formData.append("chefId", user.chefId);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("hasDiscount", hasDiscount);
    formData.append("discountPercentage", discountPercentage);
    formData.append("totalCookTime", totalCookTime / 60);
    selectedDishPayload.forEach((item, index) => {
      formData.append(`menuItems[${index}].dishId`, item.dishId);
    });
    formData.append("file", {
      uri: image.uri,
      name: `menu_${Date.now()}_chef${user?.chefId}.jpg`,
      type: "image/jpeg",
    });

    try {
      const response = await axiosInstanceForm.post("/menus", formData);
      console.log("res", response.data);
      if (response.status === 200 || response.status === 201) {
        console.log("1111");
        showModal(t("modal.success"), t("createdMenu"),);
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error) {

      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), error.response.data.message || t("errors.failedToAdd"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={commonStyles.container}>
        <Header title={t("createNewMenu")} />
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity
            style={[
              styles.imagePicker,
              fieldErrors.image && { borderColor: "red" },
            ]}
            onPress={pickImage}
          >
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder}>
                <MaterialIcons name="add-a-photo" size={40} color="gray" />
                <Text style={styles.placeholderText}>{t("pickImage")}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={[
              commonStyles.input,
              fieldErrors.name && { borderColor: "red" },
              { fontFamily: "nunito-regular" },
            ]}
            placeholder={t("placeholders.menuName")}
            value={name}
            onChangeText={setName}
          />

          <View
            style={{
              gap: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ gap: 10, flexDirection: "row", alignItems: "center" }}
            >
              <Text style={styles.itemContentLabel}>{t("hasDiscount")}:</Text>
              <Switch
                value={hasDiscount}
                onValueChange={handleCheckboxToggle}
                trackColor={{ false: "#ccc", true: "#4caf50" }}
                thumbColor={hasDiscount ? "#fff" : "#f4f3f4"}
              />
            </View>

            {hasDiscount && (
              <TextInput
                placeholder={t("placeholders.discountPercentage")}
                value={discountPercentage?.toString() || ""}
                onChangeText={(text) =>
                  setDiscountPercentage(parseFloat(text) || 0)
                }
                keyboardType="numeric"
                style={[
                  commonStyles.input,
                  {
                    width: "30%",
                    textAlign: "center",
                    fontFamily: "nunito-regular",
                  },
                  fieldErrors.discountPercentage && { borderColor: "red" },
                ]}
              />
            )}
          </View>

          <TextInput
            placeholder={t('totalCookTime')}
            keyboardType="numeric"
            value={totalCookTime.toString()}
            onChangeText={(text) =>
              setTotalCookTime(text)
            }
            style={commonStyles.input}
          />

          <TextInput
            style={[commonStyles.inputDes, { fontFamily: "nunito-regular" }]}
            placeholder={t("placeholders.description")}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setModalKey(prev => prev + 1);
                setTimeout(() => {
                  modalizeRef.current?.open()
                }, 100)
              }}
              activeOpacity={0.7}
              style={[
                {
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  backgroundColor: "#FFF8EF"
                },
                fieldErrors.dishes && { borderColor: 'red' }
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#333",
                  marginBottom: 4,
                  fontFamily: "nunito-bold",
                }}
              >
                {t("dishesTapToEdit")}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  fontFamily: "nunito-regular",
                }}
              >
                {seletedDishes.length > 0
                  ? dishes
                    .filter((dish) => seletedDishes.includes(dish.id))
                    .map((dish) => dish.name)
                    .join(", ")
                  : t("noDishesSelected")}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => handleSubmit()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.submitButtonText, { fontFamily: "nunito-bold" }]}>
                {t("createMenu")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        <Modalize ref={modalizeRef} adjustToContentHeight key={modalKey} >
          <View style={styles.modalContent}>
            <ScrollView
              style={{ padding: 10 }}
              contentContainerStyle={{ paddingBottom: 50 }}
              nestedScrollEnabled
            >
              {dishes &&
                dishes.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dishItem,
                      seletedDishes.includes(item.id) && styles.selectedDish,
                    ]}
                    onPress={() => toggleDishSelection(item.id)}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                        defaultSource={require("../../assets/images/1.jpg")}
                      />
                    </View>
                    <Text style={styles.dishName}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView >
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 50,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    color: "gray",
    fontFamily: "nunito-regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: "#A64B2A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
  modalContent: {
    minHeight: 700,
    height: 800,
    // padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // alignItems: 'center',
  },
  dishItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    elevation: 5,
  },
  selectedDish: {
    borderWidth: 2,
    borderColor: "#F8BF40",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.03 }],
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 15,
  },
  itemContentLabel: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-bold", // Thêm fontFamily
  },
  dishName: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-regular", // Thêm fontFamily
  },
});

export default AddMenu;
