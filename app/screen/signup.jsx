import { View, Text, TextInput, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordInput } from '../../components/PasswordInput/passwordInput'; // Đảm bảo đúng đường dẫn
import { commonStyles } from '../../style';
export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [mail, setMail] = useState('');
    const [fullName, setFullName] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSignUp = () => {
        router.push('/screen/verify'); 
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
    };
    const handleRePasswordChange = (value) => {
        setRePassword(value);
    };

    return (
        <ScrollView style={commonStyles.containerContent}>
            <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 400, height: 250 }}
                resizeMode="cover"
            />
            <Text style={commonStyles.titleText}>
                VIET CHEFS
            </Text>
            <TextInput
                style={commonStyles.input}
                placeholder="Full name"
                placeholderTextColor="#968B7B"
                keyboardType="default"
                value={fullName}
                onChangeText={setFullName}
            />
            <TextInput
                style={commonStyles.input}
                placeholder="Phone number"
                placeholderTextColor="#968B7B"
                keyboardType="numeric"
                value={phone}
                onChangeText={setPhone}
            />
            <TextInput
                style={commonStyles.input}
                placeholder="Mail address"
                placeholderTextColor="#968B7B"
                keyboardType="email-address"
                value={mail}
                onChangeText={setMail}
            />

            <PasswordInput
                placeholder="Password"
                onPasswordChange={handlePasswordChange}
            />
            <PasswordInput
                placeholder="Re-Password"
                onPasswordChange={handleRePasswordChange}
            />
            

            <View style={{ flex: 1, alignItems: 'center' }}>

                <TouchableOpacity onPress={handleSignUp} style={{
                    padding: 13,
                    marginTop: 10,
                    borderWidth: 1,
                    backgroundColor: '#383737',
                    borderColor: '#383737',
                    borderRadius: 50,
                    width: 300,
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 18,
                        color: '#fff',
                        fontFamily: 'nunito-bold',
                    }}>REGISTER</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
