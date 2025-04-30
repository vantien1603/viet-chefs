import React, { createContext, useState, useContext } from 'react';

const SelectedItemsContext = createContext();

export const SelectedItemsProvider = ({ children }) => {
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [selectedDishes, setSelectedDishes] = useState({});
    const [extraDishIds, setExtraDishIds] = useState([]);
    const [chefId, setChefId] = useState(null);
    const [isLoop, setIsLoop] = useState(false);
    const [address, setAddress] = useState("");
    const [selectedDay, setSelectedDay] = useState(null);
    const [numPeople, setNumPeople] = useState(1);
    const [specialRequest, setSpecialRequest] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [ingredientPrep, setIngredientPrep] = useState("customer");
    const [dishNotes, setDishNotes] = useState({});
    const [totalPrice, setTotalPrice] = useState(null);

    const clearSelection = () => {
        setSelectedMenu(null);
        setSelectedDishes({});
        setExtraDishIds({});
        setChefId(null);
        setIsLoop(false);
        setAddress("");
        setSelectedDay(null);
        setNumPeople(1);
        setSpecialRequest("");
        setStartTime(null);
        setDishNotes({});
        setIngredientPrep("customer");
        setTotalPrice(null);
        console.log("Clear")
    };

    return (
        <SelectedItemsContext.Provider value={{
            selectedMenu,
            setSelectedMenu,
            selectedDishes,
            setSelectedDishes,
            extraDishIds,
            setExtraDishIds,
            clearSelection,
            chefId,
            setChefId,
            isLoop,
            setIsLoop,
            address,
            setAddress,
            selectedDay,
            setSelectedDay,
            numPeople,
            setNumPeople,
            specialRequest,
            setSpecialRequest,
            startTime,
            setStartTime,
            ingredientPrep,
            setIngredientPrep,
            dishNotes,
            setDishNotes,
            totalPrice,
            setTotalPrice
        }}>
            {children}
        </SelectedItemsContext.Provider>
    );
};

export const useSelectedItems = () => useContext(SelectedItemsContext);
