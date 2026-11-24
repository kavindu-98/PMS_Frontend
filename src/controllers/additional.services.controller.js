
import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);





export async function useAdditionalServices() {
    const APIURL = `/additional-service-offerings/`;
    const res = await ApiClient.get(APIURL).then((res) => res.data);
    return res
}



export async function addAdditionalService({ customerId,
    customerType,
    dayOutReservationId,
    weddingReservationId,
    roomNo,
    reservationId,
    servicesData,
    advancedAmount,
    hallId,
    note }) {
    try {
        const response = await ApiClient.post("additional-service-offerings/add", {
            customerId,
            customerType,
            dayOutReservationId,
            weddingReservationId,
            roomNo,
            reservationId,
            servicesData,
            advancedAmount,
            hallId,
            note
        });
        return response;
    } catch (error) {
        throw error;
    }
}
