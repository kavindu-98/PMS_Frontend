/** @format */

import ApiClient from "../helpers/ApiClient";

import useSWR from "swr";
const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export async function useStocksExpenses({page=1, startDate, endDate }) {
  if (startDate && endDate) {
    const APIURL = `/expenses/filterByDate?startDate=${startDate}&endDate=${endDate}&page=${page}`;
    const response = await ApiClient.get(APIURL);
    console.log("response => ", response);
    return response.data;
  }
}

export const getOrderMenuItems = async ({ orderId }) => {
  try {
    if (orderId) {
      const APIURL = `/expenses/all/menu-items/${orderId}`;
      const response = await ApiClient.get(APIURL);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const getOrderMenuRawItems = async ({ orderId, recipeId }) => {
  if (orderId) {
    const APIURL = `/expenses/menu-items/raw-items?orderId=${orderId}&recipeId=${recipeId}`;
    const response = await ApiClient.get(APIURL);
    console.log("response => ", response);
    return response.data;
  }
};

export async function getStockExpenseBatchesData({page = 1,  orderId, recipeId }) {
  if (orderId) {
    const APIURL = `expenses/batch?orderId=${orderId}&recipeId=${recipeId}`;
    const response = await ApiClient.get(APIURL);

    return response.data;
    //console.log('response => ', response)
  }
}

export async function exportcsv({ startDate, endDate }) {
  const backendURL = import.meta.env.VITE_BACKEND;

  try {
    const API = `${backendURL}/expenses/filterByDate-csv?startDate=${startDate}&endDate=${endDate}`;

    window.open(API, "_blank");
  } catch (error) {
    throw error;
  }
}

// const gettimeData = async () => {
//   try {
//     let params = {

//       start_date: startDate ? moment(startDate).tz("Asia/Colombo").format("YYYY-MM-DD") : undefined,
//       end_date: endDate ? moment(endDate).tz("Asia/Colombo").format("YYYY-MM-DD") : undefined,
//     };

//   } catch (error) {
//     console.error("Error fetching date range details", error);
//   }
// };

// export function getStockExpenses({ page = 1,  order_Id= null }) {

//   const APIURL = ``;
//   // const APIURL = `/setting/rawstocks/all?page=${page}`;
//   const { data, error, isLoading } = useSWR(APIURL, fetcher);
//   return {
//     data: (order_Id || BatchId) ? data : data,
//     error,
//     isLoading,
//     APIURL,
//   };
// }
