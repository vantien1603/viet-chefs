import React, { createContext, useState, useContext } from 'react';

const SelectedItemsContext = createContext();

export const SelectedItemsProvider = ({ children }) => {
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [selectedMenuLong, setSelectedMenuLong] = useState({});
    const [selectedDishes, setSelectedDishes] = useState({});
    const [extraDishIds, setExtraDishIds] = useState({});
    const [chefId, setChefId] = useState(null);
    const [isLoop, setIsLoop] = useState(false);
    const [address, setAddress] = useState("");
    const [location, setLocation] = useState("");
    const [selectedDay, setSelectedDay] = useState(null);
    const [numPeople, setNumPeople] = useState(1);
    const [specialRequest, setSpecialRequest] = useState("");
    const [startTime, setStartTime] = useState({});
    const [ingredientPrep, setIngredientPrep] = useState("customer");
    const [dishNotes, setDishNotes] = useState({});
    const [totalPrice, setTotalPrice] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isLong, setIsLong] = useState(false);
    const [selectedDates, setSelectedDates] = useState([]);
    const [isSelected, setIsSelected] = useState({});
    const [routeBefore, setRouteBefore] = useState("");
    const [chefLong, setChefLong] = useState(null);
    const [chefLat, setChefLat] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [bookingDetailId, setBookingDetailId] = useState(null);
    const [expandedWeeks, setExpandedWeeks] = useState({});
    const [isLate, setIsLate] = useState(false);
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
        setStartTime({});
        setDishNotes({});
        setIngredientPrep("customer");
        setTotalPrice(null);
        setSelectedPackage(null);
        setIsLong(false);
        setSelectedDates([]);
        setSelectedMenuLong({});
        setIsSelected({});
        setLocation("");
        setRouteBefore("")
        setChefLat(null);
        setChefLong(null);
        setBookingId(null);
        setBookingDetailId(null);
        setIsLate(false);
        setExpandedWeeks({});
        console.log("Clear")
    };
    const clearSelectionLate = () => {
        setSelectedMenu(null);
        setSelectedDishes({});
        setExtraDishIds({});
        setIsLoop(false);
        setAddress("");
        setSelectedDay(null);
        setNumPeople(1);
        setSpecialRequest("");
        setStartTime({});
        setDishNotes({});
        setIngredientPrep("customer");
        setTotalPrice(null);
        setSelectedPackage(null);
        setIsLong(false);
        setSelectedDates([]);
        setSelectedMenuLong({});
        setIsSelected({});
        setLocation("");
        setRouteBefore("")
        setChefLat(null);
        setChefLong(null);
        setBookingDetailId(null);
        setIsLate(false);
        setExpandedWeeks({});
        console.log("Clear late")
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
            clearSelectionLate,
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
            setTotalPrice,
            selectedPackage,
            setSelectedPackage,
            isLong,
            setIsLong,
            selectedDates,
            setSelectedDates,
            selectedMenuLong,
            setSelectedMenuLong,
            isSelected,
            setIsSelected,
            location,
            setLocation,
            routeBefore,
            setRouteBefore,
            chefLat,
            setChefLat,
            chefLong,
            setChefLong,
            bookingId, setBookingId,
            bookingDetailId, setBookingDetailId,
            isLate, setIsLate,
            expandedWeeks, setExpandedWeeks
        }}>
            {children}
        </SelectedItemsContext.Provider>
    );
};

export const useSelectedItems = () => useContext(SelectedItemsContext);
