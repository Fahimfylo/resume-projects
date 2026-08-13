// hooks/useLists.js
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import API_CONFIG from "../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const useLists = () => {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLists = async () => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    try {
      const response = await axios.get(`${BASE_URL}/api/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(response.data);
    } catch (err) {
      setError(err);
      // console.error("Error fetching lists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return { lists, isLoading, error, refetch: fetchLists };
};

export default useLists;
