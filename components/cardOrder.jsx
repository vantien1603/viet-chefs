import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'

const CardOrder = () => {
    return (
        <TouchableOpacity style={{ backgroundColor: '#B9603F', flexDirection:'row',  borderRadius: 15, width:'110%', padding:12 }}>
            <View style={{alignItems:'center', justifyContent:'center', borderRightWidth:1, borderRightColor:'white', paddingRight:15}}>
                <Image
                          source={{ uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png" }} 
                          style={{ width: 80, height: 80, borderRadius: 10, marginRight: 10 }}
                        />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Yakisoba Noodles</Text>
                <Text style={{ color: 'white', fontSize: 12 }}>Noodle with Porka</Text>
            </View>
            <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
                <Text style={{ color: 'white', fontStyle: 'italic' }}>Anh Khoa</Text>
                <Text style={{ color: 'white' }}>8502 Preston Rd. Inglewood</Text>
                <Text style={{ color: 'white' }}>0123232133</Text>
                <Text style={{ color: 'white' }}>~60 mins</Text>
                <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Status: PROCESSING</Text>
            </View>

            {/* <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10 }} /> */}

        </TouchableOpacity>
    )
}

export default CardOrder