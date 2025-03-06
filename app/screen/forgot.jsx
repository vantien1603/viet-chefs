import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { commonStyles } from '../../style'
import Header from '../../components/header'
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router'
const ForgotPasswordScreen = () => {
    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title="Forgot password" />
            <Text style={{ fontSize: 16, padding: 20, textAlign: 'center', }}>Select which contact details should we use to reset your password</Text>
            <View>
                <TouchableOpacity style={styles.optionRow}>
                    <Ionicons name="chatbubble-ellipses-sharp" size={50} color="#A9411D" />
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.contentText}>Via sms</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 40 }}>•• ••• ••</Text>
                            <Text style={{ fontSize: 22 }}>8 18</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={() => router.push("/screen/forgotPassword")}>
                    <Ionicons name="mail-sharp" size={50} color="#A9411D" />
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.contentText}>Via email</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 40 }}>•••••••</Text>
                            <Text style={{ fontSize: 22 }}>@gmail.com</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contentText: {
        fontSize: 20,
        fontWeight: 400,
    },
    optionRow: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        backgroundColor: '#FFF8EF',
        alignItems: 'center',
        marginBottom: 20
    },
});

export default ForgotPasswordScreen