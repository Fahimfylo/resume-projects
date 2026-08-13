// hooks/useFetchLists.js
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const useFetchLists = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
        const response = await axios.get(`${BASE_URL}/api/list`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setLists(
          response.data
            .filter((list) => list.type !== "companies")
            .map((list) => list.name)
        );
      } catch (err) {
        setError(err.message || "An error occurred while fetching the data.");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, []);

  return { lists, loading, error };
};

export default useFetchLists;
