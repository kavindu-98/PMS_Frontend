/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";
import moment from "moment-timezone";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function usePackageItems() {
  const APIURL = `/settings/dayouts`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  // console.log("package data", data);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function addDayOutReservation(payload) {
  try {
    // Send the payload directly, not inside an object
    const response = await ApiClient.post("/dayout-reservation/add", payload);
    console.log("Payload:", payload);

    return response;
  } catch (error) {
    throw error;
  }
}

export function useDayOutReservationsInit({ type, from = null, to = null }) {
  const APIURL = `dayout-reservation/search?type=${type}&from=${from}&to=${to}&status=check-in`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function searchDayOutReservations(query) {
  try {
    const response = await ApiClient.get(
      `/dayout-reservation/get-by-name?q=${query}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateDayOutReservation(
  id,
  package_id,
  checkInTime,
  checkOutTime,
  guestCount,
  status,
  note,
  advancedAmount,
  customerId,
  finalPrice,
  paymentType,
  paymentStatus
) {
  try {
    const response = await ApiClient.put(`/dayout-reservation/update/${id}`, {
      id,
      package_id,
      checkInTime,
      checkOutTime,
      guestCount,
      status,
      note,
      advancedAmount,
      customerId,
      finalPrice,
      paymentType,
      paymentStatus,
    });
    console.log("update", response);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteDayOutReservation(id) {
  try {
    const response = await ApiClient.delete(`/dayout-reservation/delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}

export function useIncompleteDayOutReservations() {
  const APIURL = `/dayout-reservation/checkIN-search`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  console.log("reservation data", data);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

//

export async function getIncompleteDayOutReservations() {
  // Define the API endpoint
  const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
  const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");

  try {
    // Use calculated dates in the API URL
    const res = await ApiClient.get(
      `/orders/package?start_date=${yesterday}&end_date=${tomorrow}`
    );
    return res;
  } catch (error) {
    throw error;
  }
}

export async function payAndCompleteDayOutReservation(
  creditCardDigits,
  discount,
  resevationId,
  orderIds,
  services,
  promocode,
  promocodeType,
  selectedPaymentType,
  subTotal,
  taxTotal,
  total,
  miscellaneousCharges,
  note,
  serviceCharge,
  type = ""
) {
  try {
    const res = await ApiClient.post("/orders/complete-and-pay-dayoutorder", {
      creditCardDigits,
      discount,
      resevationId,
      orderIds,
      services,
      promocode,
      promocodeType,
      selectedPaymentType,
      subTotal,
      taxTotal,
      total,
      miscellaneousCharges,
      note,
      serviceCharge,
      type,
    });
    return res;
  } catch (error) {
    throw error;
  }
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

export async function getCompleteDayOutOrderPaymentSummary(
  reservation_id,
  orderIds,
  servicesIds
) {
  try {
    const res = await ApiClient.post(
      "/orders/complete-dayout_order-payment-summary",
      {
        reservation_id,
        orderIds,
        servicesIds,
      }
    );
    return res;
  } catch (error) {
    throw error;
  }
}
