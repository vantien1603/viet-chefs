import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const Header = ({ title, subtitle, onRightPress, rightIcon }) => {
    const router = useRouter();
    const onLeftPress = () => {
        router.back();
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onLeftPress}>
                <View style={styles.iconContainer}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </View>
            </TouchableOpacity>
            <View style={[styles.textContainer,{flexDirection: !subtitle && 'row'}] }>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onRightPress}>
                <View style={[styles.iconContainer, { backgroundColor: !rightIcon && 'transparent' }]}>
                    {rightIcon ? (
                        <Ionicons name={rightIcon} size={24} color="black" />
                    ) : null}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        paddingLeft:0,
        // backgroundColor: '#f9f9f9',
        borderBottomWidth: 1.5,
        borderBottomColor: '#e0e0e0',
        marginBottom:20
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#FFF8EF',
    },
    textContainer: {
        // flex: 1,
        // flexDirection:'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    title: {color:"#A9411D",
        fontSize: 26,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
    },
});

export default Header;