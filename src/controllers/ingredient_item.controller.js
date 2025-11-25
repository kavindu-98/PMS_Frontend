/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useIngredientsItems({
  page = 1,
  perPage = 12,
  itemName = "",
  isHouseKeeping = false, // Default to false
}) {
  // Convert boolean to 0 or 1
  const isHouseKeepingValue = isHouseKeeping ? 1 : 0;
  const APIURL = `/add-ingredients?page=${page}&pageSize=${perPage}&itemName=${itemName}&isHouseKeeping=${isHouseKeepingValue}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);

  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function useIngredientsItem(id) {
  const APIURL = `/add-ingredients/${id}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function addIngredientsItem(
  name,
  item_category_id,
  stock_alert,
  product_unit,
  product_purchase_unit,
  product_sale_unit,
  is_house_keeping
) {
  try {
    const response = await ApiClient.post("/add-ingredients", {
      name,
      item_category_id,
      stock_alert,
      product_unit,
      product_purchase_unit,
      product_sale_unit,
      is_house_keeping,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateIngredientsItem(
  id,
  name,
  item_category_id,
  stock_alert,
  product_unit,
  product_purchase_unit,
  product_sale_unit,
  is_house_keeping
) {
  try {
    const response = await ApiClient.put(`/add-ingredients/${id}`, {
      name,
      item_category_id,
      stock_alert,
      product_unit,
      product_purchase_unit,
      product_sale_unit,
      is_house_keeping,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function uploadIngredientsItemPhoto(id, form) {
  try {
    const response = await ApiClient.post(
      `/add-ingredients/update/${id}/upload-photo`,
      form
    );
    return response;
  } catch (error) {
    throw error;
  }
}
export async function removeIngredientsItemPhoto(id) {
  try {
    const response = await ApiClient.post(
      `/add-ingredients/update/${id}/remove-photo`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteIngredientsItem(id) {
  try {
    const response = await ApiClient.delete(`/add-ingredients/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}
