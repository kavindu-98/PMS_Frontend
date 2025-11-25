/** @format */

import ApiClient from "../helpers/ApiClient";
import useSWR from "swr";

const fetcher = (url) => ApiClient.get(url).then((res) => res.data);

export function useHousekeeping({ type, from = null, to = null }) {
  const APIURL = `/room-service-allocation/all?type=${type}&from=${from}&to=${to}`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export function useHousekeepers() {
  const APIURL = `/houseKeeping/all`;
  const { data, error, isLoading } = useSWR(APIURL, fetcher);
  return {
    data,
    error,
    isLoading,
    APIURL,
  };
}

export async function addNewHousekeeper(
  reference_code_id,
  name,
  email,
  password,
  create_by,
  phone,
  scope
) {
  try {
    const response = await ApiClient.post("/houseKeeping/add", {
      reference_code_id,
      name,
      email,
      password,
      create_by,
      phone,
      scope,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function addHousekeepingTask(
  room_no,
  task_date,
  status,
  assign_to,
  inspection_id,
  inspection_status,
  priority,
  cleaning_start_time,
  cleaning_end_time
) {
  try {
    const response = await ApiClient.post("/room-service-allocation/add", {
      room_no,
      task_date,
      status,
      assign_to,
      inspection_id,
      inspection_status,
      priority,
      cleaning_start_time,
      cleaning_end_time,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateHousekeepingTask(
  id,
  room_no,
  task_date,
  status,
  assign_to,
  inspection_id,
  inspection_status,
  priority,
  cleaning_start_time,
  cleaning_end_time
) {
  try {
    const response = await ApiClient.put(`/room-service-allocation/${id}`, {
      room_no,
      task_date,
      status,
      assign_to,
      inspection_id,
      inspection_status,
      priority,
      cleaning_start_time,
      cleaning_end_time,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteUser(username) {
  try {
    const response = await ApiClient.delete(`/users/delete/${username}`);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteHousekeepingTask(id) {
  try {
    const response = await ApiClient.delete(`/room-service-allocation/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function resetHouseKeeperPassword(id, newPassword) {
  try {
    const response = await ApiClient.put(`/houseKeeping/update-password`, {
      id,
      newPassword,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateHousekeeper(
  id,
  reference_code_id,
  name,
  email,
  phone,
  scope
) {
  try {
    const response = await ApiClient.put(`/houseKeeping/update-id-or-email`, {
      id,
      reference_code_id,
      name,
      email,
      phone,
      scope,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getHousekeepingOrders() {
  try {
    const res = await ApiClient.get(
      // `/room-service-allocation/by-house-keeper-uname/${userName}`
      `/room-service-allocation/by-house-keeper-uname/EMP001`
    );
    return res;
  } catch (error) {
    throw error;
  }
}

export async function updateHousekeepingStatus(id, type, value) {
  try {
    const response = await ApiClient.put(
      `/room-service-allocation/update-room-service-status/${id}`,
      {
        type,
        value,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function addHousekeepingItemReq(
  room_service_id,
  request_by,
  items
) {
  try {
    const response = await ApiClient.post(`/house-keeping-stock/add`, {
      room_service_id,
      request_by,
      items,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function addReturnHousekeepingItemReq(store_id, return_by, items) {
  try {
    const response = await ApiClient.post(`/house-keeping-stock/return`, {
      store_id,
      return_by,
      items,
    });
    return response;
  } catch (error) {
    throw error;
  }
}
