import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'

const CardOrder = (item) => {
    return (
        <TouchableOpacity style={{ backgroundColor: '#B9603F', flexDirection: 'row', borderRadius: 15, width: '110%', padding: 12 }}>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'white', paddingRight: 15 }}>
                {/* <Text style={{ color: 'white', fontStyle: 'italic' }}>Anh Khoa</Text> */}
                <Text style={{ color: 'white' }}>Monday, 01/01/2002</Text>
                <Text style={{ color: 'white' }}>0123232133</Text>
                <Text style={{ color: 'white' }}>60 mins, 10:00 to 11:00</Text>
                <Text style={{ color: 'white' }}>250,000 VND</Text>
                <Text style={{ color: 'white' }}>8502 Preston Rd. Inglewood</Text>

                {/* <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Status: PROCESSING</Text> */}
            </View>
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>

                <Text style={{ color: 'white', fontSize: 12 }}>Responsible Person</Text>
                <Image
                    source={{ uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png" }}
                    style={{ width: 60, height: 60, borderRadius: 30, marginRight: 10 }}
                />
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', }}>Truong Thieu Phong</Text>

            </View>
            {/* <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10 }} /> */}

        </TouchableOpacity>
    )
}

export default CardOrder