import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import { commonStyles } from '../../style'
import AntDesign from '@expo/vector-icons/AntDesign';
const ChefRegister = () => {
    const [isOpenDesciption, setIsOpenDescription] = useState(false);
    const [isOpenBio, setIsOpenBio] = useState(false);

    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title="Chef Registration" />
            <View>
                <Text>
                    "Turn your passion for cooking into profit! Sign up now and start connecting with customers!"
                </Text>
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <View style={styles.section}>
                        <TouchableOpacity style={{
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                        }}
                            onPress={() => setIsOpenDescription(!isOpenDesciption)}>
                            <View style={{
                                paddingRight: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}>
                                <Text  >Short description</Text>

                                <AntDesign name={isOpenDesciption ? "up" : "down"} size={24} color="black" />
                            </View>
                        </TouchableOpacity>
                        {isOpenDesciption && (
                            <TextInput
                                placeholder='Description'
                                multiline={true}
                                maxLength={30}
                            />
                        )}

                    </View>
                    <View style={styles.section}>
                        <TouchableOpacity style={{
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                        }}
                            onPress={() => setIsOpenBio(!isOpenBio)}>
                            <View style={{
                                paddingRight: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}>
                                <Text  >Short description</Text>

                                <AntDesign name={isOpenBio ? "up" : "down"} size={24} color="black" />
                            </View>

                        </TouchableOpacity>
                    </View>



                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    section: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        marginVertical: 20,
        borderRadius: 10,
    }
}
);

export default ChefRegister