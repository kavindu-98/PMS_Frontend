/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useHallReservations() {
  const APIURL = `/wedding-hall-reservation/getReservation`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  console.log("reservation data", data);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}
export async function addHallReservation(payload) {
  try {
    // Send the payload directly, not inside an object
    const response = await ApiClient.post(
      "/wedding-hall-reservation/add",
      payload
    );
    console.log("Payload:", payload);

    return response;
  } catch (error) {
    throw error;
  }
}

export function useHallReservationInit({ type, from = null, to = null }) {
  const APIURL = `/wedding-hall-reservation/searchReservations?type=${type}&from=${from}&to=${to}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function searchHallReservations(query) {
  try {
    const response = await ApiClient.get(
      `/wedding-hall-reservation/get-by-name?q=${query}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateHallReservation(id, payload) {
  try {
    const response = await ApiClient.put(
      `/wedding-hall-reservation/updateReservation/${id}`,
      payload
    );
    console.log("update", response);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteHallReservation(id) {
  try {
    const response = await ApiClient.delete(
      `/wedding-hall-reservation/delete/${id}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export function useHallReservationsDashboard() {
  const APIURL = `/wedding-hall-reservation/get-incomplete-reservations`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  console.log("reservation data", data);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function useIncompleteHallReservations() {
  const APIURL = `/wedding-hall-reservation/get-incomplete-reservations`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  console.log("reservation data", data);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

// export async function payAndCompleteHallReservation(payload) {
//   try {
//     const response = await ApiClient.post(`/wedding-hall-reservation/payAndCompleteWeddingReservations`, payload);
//     return response.data; // Return only `data`
//   } catch (error) {
//     throw error;
//   }
// }

export async function payAndCompleteHallReservation(payload) {
  try {
    const response = await ApiClient.post(
      `/wedding-hall-reservation/payAndCompleteWeddingReservations`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // Return only `data`
  } catch (error) {
    console.error("API Error:", error.response?.data || error);
    throw error;
  }
}

export function useServiceCharge() {
  const APIURL = `/settings/store-setting`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}
