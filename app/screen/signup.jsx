import { View, Text, TextInput, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { commonStyles } from '../../style';
import Header from '../../components/header';
import axios from 'axios';
export default function SignUpScreen() {
    const [phone, setPhone] = useState('');
    const [mail, setMail] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const router = useRouter();

    const handleSignUp = async () => {
        try {
            const signUpPayload = {
                username: username,
                email: mail,
                fullName: fullName,
                dob: "1999-01-01",
                gender: "male",
                phone: phone
            };
            console.log(signUpPayload);

            const response = await axios.post('http://192.168.146.195:8080/no-auth/register', signUpPayload,
                {
                    headers: { 'Content-Type': 'application/json' } 
                });
            console.log(response.data);
            if (response.status === 201) {
                router.push({
                    pathname: "screen/verify",
                    params: { username, fullName, phone, mail, mode: "register" }
                });
            }

        } catch (error) {
            if (error.response) {
                console.error(`Lỗi ${error.response.status}:`, error.response.data);
            }
            else {
                console.error(error.message);
            }
        }
    };

    return (

        <ScrollView style={commonStyles.containerContent}>
            <Header title="Register" />
            <View>

                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> Pleasure to be at your service!</Text>
                <Text style={{ fontSize: 16, marginTop: 10, marginBottom: 20 }}> Create an account now to experience our services!</Text>

                <Text style={commonStyles.labelInput}>Username</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder='User name'
                    value={username}
                    onChangeText={setUsername}
                />
                <Text style={commonStyles.labelInput}>First and last name</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder='Full name'
                    value={fullName}
                    onChangeText={setFullName}
                />
                <Text style={commonStyles.labelInput}>Phone number</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder="03730xxxxx"
                    // placeholderTextColor="#968B7B"
                    keyboardType="numeric"
                    value={phone}
                    onChangeText={setPhone}
                />
                <Text style={commonStyles.labelInput}>Mail address</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder="xxx@gmail.com"
                    // placeholderTextColor="#968B7B"
                    keyboardType="email-address"
                    value={mail}
                    onChangeText={setMail}
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
                        }}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}
