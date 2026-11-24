import ApiClient from "../helpers/ApiClient";

export async function useAddvanceServiceSettings() {
    const APIURL = `settings/additional-service`;
    const res = await ApiClient.get(APIURL).then((res) => res.data);
    return res
}



export async function useTaxes() {

    const APIURL = `settings/taxes`;
    const res = await ApiClient.get(APIURL).then((res) => res.data);
    return res
}



export async function addAdditionalServiceSettings({ serviceName, subService, taxId }) {
    try {
        const response = await ApiClient.post("settings/additional-service/add", {
            serviceName, subService, taxId: taxId ? Number(taxId) : null
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export async function updateAdditionalServiceSettings({ id, serviceName, subService, taxId}) {
    try {
        const response = await ApiClient.put(`settings/additional-service/update/${id}`, {
            serviceName, subService, taxId: taxId ? Number(taxId) : null
        });
        return response;
    } catch (error) {
        throw error;
    }
}



export async function deleteServiceSettings({id}) {
    try {
        const response = await ApiClient.delete(`settings/additional-service/delete/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
}
