import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";

const { width, height } = Dimensions.get("window");

// Hàm chọn ngẫu nhiên n phần tử từ một mảng
const getRandomItems = (array, n) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

export default function SearchScreen() {
  const router = useRouter();
  const { query: initialQuery, selectedAddress } = useLocalSearchParams();
  const axiosInstance = useAxios();
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [suggestions, setSuggestions] = useState([]);
  const [defaultSuggestions, setDefaultSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textInputRef = useRef(null);
  const [lastParams, setLastParams] = useState(null);
  const [cachedSuggestions, setCachedSuggestions] = useState([]);

  const parsedAddress = selectedAddress ? JSON.parse(selectedAddress) : null;

  const fetchSuggestions = async (keyword) => {
    const params = {
      keyword: keyword || "",
      customerLat: parsedAddress?.latitude || 0,
      customerLng: parsedAddress?.longitude || 0,
      distance: 30,
    };

    if (lastParams && JSON.stringify(params) === JSON.stringify(lastParams)) {
      setSuggestions(cachedSuggestions);
      setShowSuggestions(cachedSuggestions.length > 0);
      return;
    }

    try {
      const dishesResponse = await axiosInstance.get("/dishes/nearby/search", { params });
      const chefsResponse = await axiosInstance.get("/chefs/nearby/search", { params });

      const dishSuggestions = dishesResponse.data.content.map((dish) => ({
        type: "dish",
        id: dish.id,
        name: dish.name,
        imageUrl: dish.imageUrl,
      }));

      const chefSuggestions = chefsResponse.data.content.map((chef) => ({
        type: "chef",
        id: chef.id,
        name: chef.user.fullName || chef.user.username,
        imageUrl: chef.user.avatarUrl,
      }));

      const combinedSuggestions = [...dishSuggestions, ...chefSuggestions];

      // Nếu keyword rỗng (gợi ý mặc định), chọn ngẫu nhiên 6 mục
      if (!keyword) {
        const randomSuggestions = getRandomItems(combinedSuggestions, 6);
        setDefaultSuggestions(randomSuggestions);
        setShowSuggestions(randomSuggestions.length > 0);
      } else {
        // Nếu có keyword, hiển thị tất cả kết quả tìm kiếm động
        setSuggestions(combinedSuggestions);
        setShowSuggestions(combinedSuggestions.length > 0);
      }

      setCachedSuggestions(combinedSuggestions);
      setLastParams(params);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setDefaultSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      fetchSuggestions(initialQuery);
    } else {
      // Khi mở màn hình và không có query, gọi API với keyword rỗng để lấy gợi ý mặc định
      fetchSuggestions("");
    }
  }, [initialQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        fetchSuggestions("");
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchIconPress = () => {
    if (searchQuery.trim().length >= 2) {
      fetchSuggestions(searchQuery);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    router.push({
      pathname: "/screen/searchResult",
      params: {
        query: suggestion.name,
        type: suggestion.type,
        selectedAddress: selectedAddress || null,
      },
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push({
        pathname: "/screen/searchResult",
        params: {
          query: searchQuery,
          selectedAddress: selectedAddress || null,
        },
      });
    }
  };

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#4EA0B7" />
        </TouchableOpacity>
        <View style={styles.searchInputWrapper}>
          <TouchableOpacity onPress={handleSearchIconPress}>
            <Icon name="search" size={24} color="#4EA0B7" style={styles.searchIcon} />
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            placeholder="Search chefs or dishes"
            placeholderTextColor="#4EA0B7"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={true}
          />
        </View>
      </View>

      {/* Hiển thị tiêu đề "Gợi ý tìm kiếm" và danh sách 6 gợi ý ngẫu nhiên từ API khi ô tìm kiếm trống */}
      {searchQuery.trim().length === 0 && showSuggestions && (
        <View style={styles.defaultSuggestionsContainer}>
          <Text style={styles.sectionTitle}>Gợi ý tìm kiếm</Text>
          <FlatList
            data={defaultSuggestions}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.defaultSuggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.defaultSuggestionImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.defaultSuggestionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
          />
        </View>
      )}

      {/* Hiển thị kết quả tìm kiếm động khi người dùng nhập từ khóa */}
      {showSuggestions && searchQuery.trim().length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.suggestionImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionText}>{item.name}</Text>
                  <Text style={styles.suggestionType}>
                    {item.type === "dish" ? "Dish" : "Chef"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBE5DD",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#4EA0B7",
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#4EA0B7",
  },
  searchIcon: {
    marginLeft: 15,
  },
  suggestionsContainer: {
    backgroundColor: "#EBE5DD",
    maxHeight: height * 0.5,
    padding: 10,
    zIndex: 10,
  },
  suggestionsList: {
    maxHeight: 480,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    borderRadius: 10,
    marginBottom: 5,
  },
  suggestionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  suggestionTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  suggestionType: {
    fontSize: 12,
    color: "#4EA0B7",
  },
  defaultSuggestionsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  defaultSuggestionItem: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 5,
    alignItems: "center",
    height: 170
  },
  defaultSuggestionImage: {
    width: (width - 110) / 2,
    height: 130,
    borderRadius: 10,
    marginVertical: 5,
  },
  defaultSuggestionText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
});