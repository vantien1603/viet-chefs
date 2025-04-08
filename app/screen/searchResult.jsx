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
  import React, { useState, useEffect } from "react";
  import { commonStyles } from "../../style";
  import { SafeAreaView } from "react-native-safe-area-context";
  import Header from "../../components/header";
  import Icon from "react-native-vector-icons/Ionicons";
  import { useLocalSearchParams, useRouter } from "expo-router";
  
  const SearchResultScreen = () => {
    const { query } = useLocalSearchParams();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(query || "");
    const [isSelected, setIsSelected] = useState(0); // Mặc định chọn "Recommended" (index 0)
  
    const options = [
      { index: 0, name: "Recommended" },
      { index: 1, name: "Chefs" },
      { index: 2, name: "Ratings" },
      { index: 3, name: "Distance" }, // Thêm một số tùy chọn khác nếu cần
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
  
    useEffect(() => {
      setSearchQuery(query || ""); // Cập nhật thanh search khi query thay đổi từ Home
    }, [query]);
  
    const isSelectedOption = (index) => {
      return isSelected === index;
    };
  
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title="Search Results" />
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Icon
            name="search"
            size={24}
            color="#4EA0B7"
            style={styles.searchIcon}
            onPress={handleSearch}
          />
        </View>
  
        <View style={styles.rowNgayGui}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.index.toString()}
            horizontal
            renderItem={({ item }) => {
              const selected = isSelectedOption(item.index);
  
              return (
                <TouchableOpacity
                  style={[
                    styles.dayContainer,
                    selected && styles.selectedDay,
                  ]}
                  onPress={() => setIsSelected(item.index)}
                >
                  <Text style={selected ? styles.selectedText : styles.normalText}>
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
      </SafeAreaView>
    );
  };
  
  const styles = StyleSheet.create({
    searchContainer: {
      position: "relative",
      marginTop: 10,
      marginBottom: 20,
    },
    searchInput: {
      backgroundColor: "#FFF8EF",
      borderColor: "#ddd",
      borderWidth: 2,
      height: 60,
      borderRadius: 100,
      padding: 20,
      fontSize: 16,
    },
    searchIcon: {
      position: "absolute",
      right: 10,
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
    //   marginTop: 23,
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