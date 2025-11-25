import apiClient from "../helpers/ApiClient";
import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function usePromoCode({page = 1}) {
    const APIURL = `/promocode?page=${page}`;
    const {data, error, isLoading} = useSWR(APIURL, fetcher);
    return{
        data,
        error,
        isLoading,
        APIURL,

    };
}

//export async function editPromoCode ({ promo_code, type, company_name, email, discount, start_date, end_date, adjustmentBy}) {
export async function editPromoCode({ id, promo_code, type, company_name, email, discount, start_date, end_date }) {
  try {

    const response = await ApiClient.patch(`/promocode/${id}`, {
      promo_code,
      type,
      company_name,
      email,
      discount,
      start_date,
      end_date

    });

    return response;
  } catch (error) {
    console.error("Error updating PromoCode:", error);
    throw error;
  }
}



  export async function addPromoCode({promo_code, type, company_name, email, discount, start_date, end_date }) {
    try {
      const response = await ApiClient.post("/promocode", {
        promo_code, type, company_name, email, discount, start_date,end_date
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

export const deletePromoCode = async ({ id }) => {
  try {
    const response = await ApiClient.patch(`/promocode/delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}
  

