/** @format */

import React, { useEffect } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconArmchair2,
  IconQrcode,
  IconDoor,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import {
  useAddvanceServiceSettings,
  useTaxes,
  addAdditionalServiceSettings,
  deleteServiceSettings,
  updateAdditionalServiceSettings,
} from "../../controllers/additional.service.settings.controller";

const AdditionalServiceSettings = () => {
  const [additionalServSettData, setAdditionalServSettData] = useState([]);
  const [tableData, settableData] = useState([]);
  const [searchTaxData, setSearchTaxData] = useState([]);
  const [subServiceData, setSubServiceData] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const titleRef = useRef();
  const priceRef = useRef();
  const netPriceRef = useRef();
  const taxIdRef = useRef();
  const subserviceIdRef = useRef();
  const subServicePriceRef = useRef();
  const subServiceRef = useRef();
  const subServiceUpdateRef = useRef();
  const subServicePriceUpdateRef = useRef();
  const categoryIdRef = useRef();

  const [formData, setFormData] = useState({
    editServiceId: null,
    serviceName: null,
    taxId: null,
    subService: [],
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((ps) => ({
      ...ps,
      [name]: value,
    }));
  };

  const clearFields = () => {
    setFormData((ps) => ({
      ...ps,
      editServiceId: null,
      serviceName: "",
      taxId: "",
      subService: [],
    }));
  };

  const fetchAdditionalServiceData = async () => {
    const res = await useAddvanceServiceSettings();
    setAdditionalServSettData(res.data);
    console.log("useAddvanceServiceSettings", res);
  };

  const fetchTaxData = async () => {
    const res = await useTaxes();
    setSearchTaxData(res);
  };

  useEffect(() => {
    fetchTaxData();
    fetchAdditionalServiceData();
  }, []);

  const addAdditionalServSettings = async () => {
    const { serviceName, taxId, subService, editServiceId } = formData;

    if (!serviceName) {
      toast.error("Please Enter Sub Service Title!");
      return;
    }
    // if (!taxId) {
    //     toast.error("Please Enter Tax Id!");
    //     return;
    // }
    if (subService.length === 0) {
      toast.error("Please Enter Sub Service Price!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = editServiceId
        ? await updateAdditionalServiceSettings({
            id: editServiceId,
            serviceName,
            subService,
            taxId,
          })
        : await addAdditionalServiceSettings({
            serviceName,
            subService,
            taxId,
          });

      console.log("service data", res);
      if (res.status === 200) {
        clearFields();
        toast.dismiss();
        toast.success(res.data.message);
        fetchAdditionalServiceData();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };

  const addSubService = () => {
    const name = subServiceRef.current.value;
    const price = Number(subServicePriceRef.current.value);

    if (!name) {
      toast.error("Please enter sub service title");
      return;
    }
    if (!price) {
      toast.error("Please enter sub service price");
      return;
    }

    const subServices = [...formData.subService];
    subServices.push({ name, price });

    setFormData((ps) => ({ ...ps, subService: subServices }));

    subServiceRef.current.value = "";
    subServicePriceRef.current.value = "";
  };

  const btnSubServiceDelete = (index) => {
    const subData = [...formData.subService];
    subData.splice(index, 1);
    setFormData((ps) => ({ ...ps, subService: subData }));
  };

  const btnServiceEdit = (service) => {
    console.log("service => ", service);
    setFormData((ps) => ({
      ...ps,
      editServiceId: service.id,
      serviceName: service.service_name,
      subService: service.sub_service,
      taxId: service.tax_id,
    }));
    document.getElementById("modal-add").showModal();
  };

  const btndeleteServiceAdditionalServ = async (id) => {
    toast.loading("Please wait...");
    const res = await deleteServiceSettings({ id });
    if (res?.status === 200) {
      toast.dismiss();
      toast.success(res.data?.message);
      fetchAdditionalServiceData();
    } else {
      toast.dismiss();
      toast.error('"Failed to delete store."');
    }
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Additional Service Settings</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="mt-8 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.isArray(additionalServSettData) &&
        additionalServSettData?.length > 0 ? (
          additionalServSettData.map((service, index) => {
            return (
              <div
                key={index}
                className="border px-4 py-3 rounded-2xl flex flex-col gap-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <IconDoor />
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-2">
                        Service Name: {service.service_name}
                      </p>
                      <p className="text-gray-400 font-bold mb-2">
                        Tax: {service.tax_id ? service.tax_id : "Not included"}
                      </p>
                      <p className="text-gray-400 font-bold">Sub Services: </p>

                      {service?.sub_service?.map((sub) => (
                        <div className="text-gray-400 font-bold ml-3 flex justify-between gap-4">
                          <p>{sub.name}:</p>
                          <p>{sub.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-0">
                    <button
                      onClick={() => {
                        btnServiceEdit(service);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
                    >
                      <IconPencil stroke={iconStroke} />
                    </button>
                    <button
                      onClick={() => {
                        btndeleteServiceAdditionalServ(service.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-gray-100 transition active:scale-95"
                    >
                      <IconTrash stroke={iconStroke} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">No Data available</p>
        )}
      </div>

      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{`${
            formData.editServiceId ? "Edit" : "Add"
          }  Additional Service Settings`}</h3>

          <div className="flex gap-4 w-full my-4"></div>
          <div className="flex-1">
            <label
              htmlFor="item_name"
              className="mb-1 block text-gray-500 text-sm"
            >
              Service Title
            </label>
            <input
              // ref={storeNameRef}
              type="text"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Service Name"
            />
          </div>

          {/* Tax amount */}
          <div className="flex-1">
            <label htmlFor="tax" className="mb-1 block text-gray-500 text-sm">
              Tax
            </label>
            <select
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Tax"
            >
              <option value="">None</option>
              {searchTaxData?.map((tax, index) => {
                return (
                  <option value={tax.id} key={index}>
                    {tax.title} - {tax.rate}% ({tax.type})
                  </option>
                );
              })}
            </select>
          </div>

          {/*  sub Services */}
          <div className="collapse bg-gray-50 collapse-arrow mt-6">
            <input type="checkbox" />
            <div className="collapse-title font-medium">Sub Services</div>
            <div className="collapse-content flex flex-col">
              {formData?.subService?.map((service, index) => {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between hover:bg-gray-100 transition p-2 rounded-lg cursor-pointer"
                  >
                    <div className="flex-1">
                      <p>{service.name}</p>
                      <p className="text-xs text-gray-500">
                        Price: {service.price}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          btnSubServiceDelete(index);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-gray-200 transition active:scale-95"
                      >
                        <IconTrash stroke={iconStroke} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() =>
                  document.getElementById("modal-add-subService").showModal()
                }
                className="btn btn-sm mt-4"
              >
                Add Sub Service
              </button>
            </div>
          </div>
          {/* sub Services */}

          <div className="modal-action">
            <form method="dialog">
              <button
                onClick={() => clearFields()}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              {/* {tax_id && (
                                <p className="text-sm text-gray-500">
                                    Tax: {tax_title} - {tax_rate}% ({tax_type})
                                </p>
                            )} */}
              <button
                onClick={() => {
                  addAdditionalServSettings();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {/* subService update dialog */}
      <dialog
        id="modal-update-subService"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Update Sub Service</h3>

          <div className="mt-4">
            <input type="hidden" ref={subserviceIdRef} />
            <label htmlFor="title" className="mb-1 block text-gray-500 text-sm">
              Sub Service Title
            </label>
            <input
              ref={subServiceUpdateRef}
              type="text"
              name="title"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Sub Service"
            />
          </div>

          <div className="my-4">
            <label htmlFor="price" className="mb-1 block text-gray-500 text-sm">
              Sub Service Price
            </label>
            <input
              ref={subServicePriceUpdateRef}
              type="number"
              name="price"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Variant Price"
            />

            <p className="text-xs text-gray-500 mt-1">
              *Entered price = Final price, overrides base price.
            </p>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdateVariant();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* subService update dialog */}

      {/* add sub service dialog */}
      <dialog
        id="modal-add-subService"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Add New sub Service</h3>

          <div className="mt-4">
            <label htmlFor="title" className="mb-1 block text-gray-500 text-sm">
              Sub Service Title
            </label>
            <input
              ref={subServiceRef}
              id="subservice"
              type="text"
              name="title"
              // onChange={handleSubServiceChange}

              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Variant Title"
            />
          </div>

          <div className="my-4">
            <label htmlFor="price" className="mb-1 block text-gray-500 text-sm">
              Sub Service Price
            </label>
            <input
              ref={subServicePriceRef}
              id="sub_service_price"
              type="text"
              name="price"
              // onChange={handleSubServiceChange}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Sub Service  Price"
            />
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={() => {
                  addSubService();
                  //handleSubServiceChange();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/*  add sub service dialog */}
    </Page>
  );
};

export default AdditionalServiceSettings;
