/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useStocks({
  page = 1,
  categoryId = null,
  itemName = null,
  stores_id = null,
}) {
  let filterQuery = null;

  if (!categoryId && !itemName && !stores_id) {
    filterQuery = `all?page=${page}`;
  } else if (categoryId) {
    filterQuery = `searchById?categoryId=${categoryId}&page=${page}`;
  } else if (itemName) {
    filterQuery = `searchByName?itemName=${itemName}&page=${page}`;
  } else if (stores_id) {
    filterQuery = `all?stores_id=${stores_id}&page=${page}`;
  }

  const APIURL = `/setting/rawstocks/${filterQuery}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data: categoryId || itemName ? data?.data : data,
    error,
    isLoading,
    APIURL,
  };
}

export function stockTransferLog({
  from = null,
  to = null,
  page = null,
  type,
  limit = null,
}) {
  const APIURL = `/setting/rawstocks/stock-transfer-log?type=${type}&from=${from}&to=${to}&page=${page}&limit=${limit}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function stockConsumption(
  {
    // from = null,
    // to = null,
    // page = null,
    // type,
    // limit = null,
  }
) {
  // const APIURL = `/setting/rawstocks/stock-transfer-log?type=${type}&from=${from}&to=${to}&page=${page}&limit=${limit}`;
  const APIURL = `/house-keeping-stock/get`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function stockReturnLog({
  from = null,
  to = null,
  // page = null,
  type,
  // limit = null,
}) {
  const APIURL = `/house-keeping-stock/stock-return?type=${type}&from=${from}&to=${to}`;
  // const APIURL = `/house-keeping-stock/get`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function stockTransferLogExport({
  from = null,
  to = null,
  page = null,
  type,
  limit = null,
}) {
  const APIURL = `/setting/rawstocks/stock-transfer-log?type=${type}&from=${from}&to=${to}&page=${page}&limit=${limit}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function addStock({
  itemId,
  addedQuantity,
  expiredDate,
  batchPrice,
  storeId,
  addBy,
}) {
  try {
    const response = await ApiClient.post("/setting/rawstocks/add", {
      itemId,
      addedQuantity,
      expiredDate,
      batchPrice,
      storeId,
      addBy,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function stockTransfer({
  from_store,
  to_store,
  item_id,
  quantity,
  transfer_by,
}) {
  try {
    const response = await ApiClient.post("/setting/rawstocks/stock-transfer", {
      from_store,
      to_store,
      item_id,
      quantity,
      transfer_by,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function editStock({
  batch_id,
  old_quantity,
  new_quantity,
  reason,
  adjustmentBy,
}) {
  try {
    const response = await ApiClient.patch(
      `/setting/rawstocks/update/${batch_id}`,
      {
        old_quantity,
        new_quantity,
        reason,
        adjustmentBy,
      }
    );

    return response;
  } catch (error) {
    console.error("Error updating stock:", error);
    throw error;
  }
}

export async function deleteStock({ stockId, adjustmentBy }) {
  try {
    const response = await ApiClient.delete(
      `/setting/rawstocks/delete/${stockId}/${adjustmentBy}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}
