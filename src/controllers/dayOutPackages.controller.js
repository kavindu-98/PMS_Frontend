/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function usePackageItems() {
  const APIURL = `/settings/dayouts`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function useDayOutPackageByName(id) {
  const APIURL = `/settings/dayouts/get-by-name?id=${id}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function useDayOutPackageById(id) {
  const APIURL = `/settings/dayouts/${id}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);

  console.log("API response:", data); // Debugging

  return {
    data: data?.data || null, // Ensure only `data` field is returned
    error,
    isLoading,
    APIURL,
  };
}

export async function addPackages(formData) {
  try {
    const response = await ApiClient.post("/settings/dayouts/add", formData);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updatePackages(id, payload) {
  try {
    const response = await ApiClient.put(
      `/settings/dayouts/update/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Payload sent:", payload);
    return response;
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
}

export async function deletePackage(id) {
  try {
    const response = await ApiClient.delete(`/settings/dayouts/delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}
