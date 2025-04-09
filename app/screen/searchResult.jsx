import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import Icon from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const SearchResultScreen = () => {
  const { query } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [isSelected, setIsSelected] = useState(0);
  const modalizeRef = useRef(null);

  const options = [
    { index: 0, name: "Recommended" },
    { index: 1, name: "Chefs" },
    { index: 2, name: "Ratings" },
    { index: 3, name: "Distance" },
  ];

  const filterOptions = [
    { id: 1, name: "Price: Low to High" },
    { id: 2, name: "Price: High to Low" },
    { id: 3, name: "Rating" },
    { id: 4, name: "Nearest" },
  ];

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery !== "") {
      router.replace({
        pathname: "/screen/searchResult",
        params: { query: trimmedQuery },
      });
    }
  };

  const openFilterModal = () => {
    modalizeRef.current?.open();
  };

  const closeFilterModal = () => {
    modalizeRef.current?.close();
  };

  const handleBack = () => {
    router.push("/(tabs)/home"); 
  };

  useEffect(() => {
    setSearchQuery(query || "");
  }, [query]);

  const isSelectedOption = (index) => {
    return isSelected === index;
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#4EA0B7" /> 
        </TouchableOpacity>
        <View style={styles.searchInputWrapper}>
          <Icon
            name="search"
            size={24}
            color="#4EA0B7" 
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#4EA0B7"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity onPress={openFilterModal} style={styles.filterIcon}>
          <Icon name="filter" size={24} color="#4EA0B7" /> 
        </TouchableOpacity>
      </View>

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Options</Text>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.filterOption}
              onPress={() => {
                console.log(`Selected filter: ${option.name}`);
                closeFilterModal();
              }}
            >
              <Text style={styles.filterText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modalize>

      <View style={styles.rowNgayGui}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.index.toString()}
          horizontal
          renderItem={({ item }) => {
            const selected = isSelectedOption(item.index);

            return (
              <TouchableOpacity
                style={[styles.dayContainer, selected && styles.selectedDay]}
                onPress={() => setIsSelected(item.index)}
              >
                <Text
                  style={selected ? styles.selectedText : styles.normalText}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <ScrollView>
        <View style={{ marginBottom: 30 }}>
          <View
            style={{
              width: 200,
              alignItems: "center",
              backgroundColor: "#A9411D",
              borderRadius: 16,
              paddingBottom: 10,
            }}
          >
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png",
                  }}
                  style={styles.image}
                />
              </View>
              <Text style={styles.title}>Yakisoba Noodles</Text>
              <Text style={{ color: "#F8BF40" }}>Noodle with Pork</Text>
            </View>
            <View
              style={{
                backgroundColor: "#fff",
                marginTop: -5,
                borderRadius: 30,
                padding: 5,
                position: "absolute",
                bottom: -20,
              }}
            >
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>i</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  // Search Bar Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
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
    borderColor: "#4EA0B7", // Changed border color
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#4EA0B7", // Changed text color
  },
  searchIcon: {
    marginLeft: 15,
  },
  filterIcon: {
    marginLeft: 10,
  },
  // Modal Styles
  modalStyle: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: "#CCC",
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  filterOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  filterText: {
    fontSize: 16,
    color: "#333",
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: 200,
    position: "relative",
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
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 70,
    textAlign: "center",
    marginBottom: 5,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#F8BF40",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#FFF",
  },
  rowNgayGui: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 33,
  },
  dayContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#FFF8EF",
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: "#4EA0B7",
  },
  normalText: {
    color: "#333",
  },
  selectedText: {
    color: "#FFF",
  },
});

export default SearchResultScreen;