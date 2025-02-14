import { View, Text, Image, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { commonStyles } from '../../style'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'

const SearchResultScreen = () => {
    const option = [
        { index: 0, name: "Chefs" },
        { index: 1, name: "Recommended" },
        { index: 2, name: "Ratings" },
        { index: 4, name: "Ratings" },
        { index: 5, name: "Ratings" },
        { index: 6, name: "Ratings" },

    ];
    const [isSelected, setIsSelected] = useState(null);

    const isSelectedOption = (option) => {
        return isSelected && isSelected.index == option;
    };
    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title="Near me" />

            <View style={styles.rowNgayGui}>
                <FlatList
                    data={option}
                    keyExtractor={(item) => item.index.toString()}
                    horizontal
                    renderItem={({ item }) => {
                        const isSelected = isSelectedOption(item.index);

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.dayContainer,
                                    //     isDisabled && styles.disabledDay,
                                    isSelected && styles.selectedDay,
                                ]}
                                //   disabled={isDisabled}
                                onPress={() => setIsSelected(item.date)}
                            >
                                <Text>{item.name}</Text>
                                {/* <Text>{item.day}</Text> */}
                            </TouchableOpacity>
                        );
                    }}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            <View style={{ marginBottom: 30 }}>
                <View style={{ width: 200, alignItems: 'center', backgroundColor: '#A9411D', borderRadius: 16, paddingBottom: 10 }} >
                    <View style={styles.card}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={{
                                    uri: 'https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png',
                                }}
                                style={styles.image}
                            />
                        </View>

                        <Text style={styles.title}>Yakisoba Noodles</Text>
                        <Text style={{ color: '#F8BF40' }}>Noodle with Pork</Text>
                    </View>
                    <View style={{ backgroundColor: '#fff', marginTop: -5, borderRadius: 30, padding: 5, position: 'absolute', bottom: -20 }}>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>i</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#A9411D',
        borderRadius: 16,
        padding: 16,
        paddingTop: 50,
        alignItems: 'center',
        width: 200,
        position: 'relative',
        // marginBottom: 20
    },
    imageContainer: {
        width: 130,
        height: 130,
        borderRadius: 70,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        marginBottom: 8,
        position: 'absolute',
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        // height: '100%',

    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 70,
        textAlign: 'center',
        marginBottom: 5
      },
      button: {
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#F8BF40',
        justifyContent: 'center',
        alignItems: 'center',
      },
      buttonText: {
        fontSize: 18,
        color: '#FFF',
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
        alignItems: 'center',
        backgroundColor: '#FFF8EF',
        borderRadius: 20,
    },
    selectedDay: {
        backgroundColor: '#4EA0B7',
        color: 'white'
    },
})

export default SearchResultScreen