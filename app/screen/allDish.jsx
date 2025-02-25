import { View, Text, Image, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { commonStyles } from '../../style'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'

const AllDishScreen = () => {
    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title="All dishes" rightIcon={"search"}/>

            <View style={{ marginBottom: 30 }}>
                <View style={{ width: 200, alignItems: 'center', backgroundColor: '#A9411D', borderRadius: 16, paddingBottom: 10 }} >
                    <View style={styles.card}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={
                                    require('../../assets/images/dish1.jpg')
                                }
                                style={styles.image}
                            />
                        </View>

                        <Text style={styles.title}>Yakisoba Noodles</Text>
                        <Text style={{ color: '#F8BF40' }}>Noodle with Pork</Text>
                        <Text>~ 30 minutes</Text>
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
        height: '100%',
        resizeMode: 'cover',
    },
    title: {
        fontSize: 17,
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

export default AllDishScreen