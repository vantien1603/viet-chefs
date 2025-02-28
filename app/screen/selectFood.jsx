import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/header';
import { commonStyles } from '../../style';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const SelectFood = () => {
    const [isChecked, setIsChecked] = useState(false);

    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title="Select food" />
            <View>
                <View>
                    <View style={{ width: 200, alignItems: "center", marginBottom: 20 }}>
                        <View style={styles.card}>
                            {/* Checkbox ở góc trên bên trái */}
                            <TouchableOpacity
                                style={[
                                    styles.checkbox,
                                    { backgroundColor: isChecked ? '#F8BF40' : 'transparent' },
                                ]}
                                onPress={() => setIsChecked(!isChecked)} // Chuyển đổi trạng thái khi nhấn
                            >
                                <Text style={styles.checkboxText}>
                                    {isChecked ? (
                                        ''
                                    ) :
                                        (
                                            <MaterialIcons name="check-box-outline-blank" size={24} color="black" />
                                        )}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.imageContainer}>
                                <Image
                                    source={require("../../assets/images/logo.png")}
                                    style={styles.image}
                                />
                            </View>

                            <Text style={styles.title}>Yakisoba Noodles</Text>
                            <Text style={{ color: "#F8BF40" }}>Noodle with Pork</Text>
                        </View>
                    </View>
                </View>
            </View>
            <TouchableOpacity
                style={{
                    position: "absolute",
                    bottom: 50,
                    left: 20,
                    right: 20,
                    backgroundColor: "#A64B2A",
                    padding: 15,
                    borderRadius: 10,
                    alignItems: "center",
                    // elevation: 5,
                }}
            >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                    Continues
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default SelectFood;

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#A9411D",
        borderRadius: 16,
        padding: 16,
        paddingTop: 50,
        alignItems: 'center',
        width: 200,
        position: "relative",
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 70,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        marginBottom: 8,
        position: "absolute",
        top: -20,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: "100%",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFF",
        marginTop: 70,
        textAlign: "center",
        marginBottom: 5,
    },
    checkbox: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 28, // Tăng kích thước để trông rõ hơn
        height: 28, // Tăng kích thước để trông rõ hơn
        borderRadius: 14, // Nửa chiều rộng/cao để tạo hình tròn hoàn hảo
        borderWidth: 2,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxText: {
        left: 2,
        fontSize: 18, // Tăng kích thước chữ để phù hợp với checkbox lớn hơn
        color: '#A9411D', // Màu nâu đậm để đối lập với background vàng cam khi checked
        fontWeight: 'bold', // Làm chữ đậm hơn để nổi bật
    },
});