/** @format */

import apiClient from "../helpers/ApiClient";
import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useCompletedOrders() {
  const APIURL = `/onlineorder/orders/completed`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

// get data to the Table
export function getCompletedOrderData({
  page = 1,
  orderId = null,
  startDate = null,
  endDate = null,
}) {
  // let filterQuery = null;

  // if(!orderId && !menuItem){
  //   filterQuery = 'all'
  // }else if(orderIdId){
  //   filterQuery = `searchById?orderId=${orderId}`
  // }

  const APIURL = `/onlineorder/orders/completed`;
  // const APIURL = `/setting/rawstocks/all?page=${page}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

// get data to

export function useorderId() {
  const APIURL = `/`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}
