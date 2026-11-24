/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useQuotation({ type, from = null, to = null }) {
  const APIURL = `/quotation/quotations?type=${type}&from=${from}&to=${to}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function addQuotation({ transformedData }) {
  console.log("Received Quotation Data:", transformedData);

  // Destructure the required fields from transformedData
  const {
    service = [],
    total,
    service_charge,
    TAX,
    sub_total,
  } = transformedData;
  const customer_id = service[0]?.customer_id;

  try {
    const response = await ApiClient.post("/quotation/add", {
      customer_id,
      service_charge,
      TAX,
      sub_total,
      total,
      service,
    });
    return response;
  } catch (error) {
    throw error;
  }
}
