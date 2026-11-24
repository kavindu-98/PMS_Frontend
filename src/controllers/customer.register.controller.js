import ApiClient from "../helpers/ApiClient";



export async function addCustomer(phone, name, email, password, birthDate, gender) {
    try {
      const response = await ApiClient.post("", {
        phone,
        name,
        email,
        password,
        birthDate,
        gender,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }