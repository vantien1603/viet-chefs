import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import useAxios from "../config/AXIOS_API";
import axios from "axios";
import { AuthContext } from "../config/AuthContext";

export const ChefContext = createContext();

export const ChefProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [chefInfo, setChefInfo] = useState(null);
  const [loadingChef, setLoadingChef] = useState(true);

  const axiosInstance = useAxios();

  const fetchChefInfo = useCallback(async () => {
    if (!user?.chefId) return;

    try {
      const res = await axiosInstance.get(`/chefs/${user?.chefId}`);
      setChefInfo(res.data);
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.log("Failed to fetch chef info:", error?.response?.data || error.message);
    } finally {
      setLoadingChef(false);
    }
  }, [user?.chefId]);

  useEffect(() => {
    if (user?.chefId) {
      fetchChefInfo();
    } else {
      setLoadingChef(false);
    }
  }, [user?.chefId, fetchChefInfo]);

  return (
    <ChefContext.Provider value={{ chefInfo, setChefInfo, fetchChefInfo, loadingChef }}>
      {children}
    </ChefContext.Provider>
  );
};
