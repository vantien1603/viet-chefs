import React, { useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { commonStyles } from '../../style'
import Header from '../../components/header'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'
const ForgotPasswordScreen = () => {
    const router= useRouter();
    const [mail,setMail] = useState();
    const handleForgot =() =>{
        router.push({ pathname: "screen/verify", params: { mail, mode: "forgot" } });

    }
    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title="Forgot password" />
            <Text style={{ fontSize: 16, paddingVertical: 20, }}>Select which contact details should we use to reset your password</Text>
            <View>
                <TouchableOpacity onPress={()=> handleForgot()} style={styles.optionRow}>
                    <Ionicons name="chatbubble-ellipses-sharp" size={40} color="#A9411D" />
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.contentText}>Via sms</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 36 }}>•• ••• ••</Text>
                            <Text style={{ fontSize: 18 }}>8 18</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow}>
                    <Ionicons name="mail-sharp" size={40} color="#A9411D" />
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.contentText}>Via email</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 36}}>•••••••</Text>
                            <Text style={{ fontSize: 18 }}>@gmail.com</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contentText: {
        fontSize: 18,
        fontWeight: 400,
    },
    optionRow: {
        borderRadius: 20,
        padding: 10,
        flexDirection: 'row',
        backgroundColor: '#FFF8EF',
        alignItems: 'center',
        marginBottom: 20
    },
});

export default ForgotPasswordScreen