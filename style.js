import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#EBE5DD',
  },
  containerContent: {
    flex: 1,
    padding: 10,
    paddingBottom: 0,
    paddingTop: 10,
    backgroundColor: '#EBE5DD',
    // fontFamily: 'nunito-medium',
    // justifyContent:'center',
    // alignItems:'center'
  },
  titleText: {
    fontFamily: 'nunito-bold',
    margin: 25,
    fontSize: 35,
    color: '#A9411D',
    textAlign: 'center',
    marginBottom: 30,
    // fontWeight: "bold",
  },
  subTitleText: {
    fontFamily: 'nunito-bold',
    margin: 25,
    fontSize: 20,
    color: '#A9411D',
    textAlign: 'center',
    marginBottom: 30,
    // fontWeight: "bold",
  },
  flagButton: {
    position: 'absolute',
    right: 20,
    top: 60,
  },
  flagIcon: {
    width: 40,
    height: 40,
  },
  labelInput: {
    fontFamily: "nunito-regular",
    fontSize: 16,
    marginTop: 5
  },
  input: {
    height: 50,
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: '#968B7B'
  },
  inputDes: {
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: '#968B7B',
    height: 100,

  },
  subButton: {
    textAlign: 'center',
    color: '#A9411D',
    marginBottom: 20,
  },
  mainButtonContainer: {
    alignItems: 'center',
    textAlign: 'center'
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 50
  },
  mainButton: {
    padding: 13,
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: '#383737',
    borderColor: '#383737',
    borderRadius: 50,
    width: 300,
  },
  textMainButton: {
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    // fontFamily: 'nunito-bold',
  },
  orText: {
    textAlign: 'center',
    color: '#CCCCCC',
    marginVertical: 20,
  },
  googleButton: {
    borderRadius: 30,
    height: 50,
    borderWidth: 1,
    borderColor: '#EBE5DD'
  },
  facebookButton: {
    borderRadius: 8,
  },
  socialButtonText: {
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    margin: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  searchIcon: {
    color: 'gray',
    fontSize: 20,
    marginRight: 10,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 15,
    color: '#000',
  },
});
