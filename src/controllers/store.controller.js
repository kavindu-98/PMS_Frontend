/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useStores() {
  const APIURL = `/stores/get-all-stores`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function addStores({
  storeName,
  storeLocation,
  isConsumableStore,
  isHouseKeeping,
}) {
  try {
    const response = await ApiClient.post("stores/add", {
      storeName,
      storeLocation,
      isConsumableStore,
      isHouseKeeping,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateStores({
  storeId,
  storeName,
  storeLocation,
  isConsumableStore,
}) {
  try {
    const response = await ApiClient.put(`/stores/update/${storeId}`, {
      storeName,
      storeLocation,
      isConsumableStore,
    });

    return response;
  } catch (error) {
    console.error("Error updating store:", error);
    throw error;
  }
}

export async function deleteStores({ id }) {
  try {
    const response = await ApiClient.delete(`/stores/delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}
