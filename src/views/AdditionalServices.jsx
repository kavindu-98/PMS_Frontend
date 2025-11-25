/** @format */

import React, { useEffect } from "react";
import Page from "../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconArmchair2,
  IconQrcode,
  IconDoor,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import AsyncCreatableSelect from "react-select/async-creatable";
import {
  useRoomReservationsPOS,
  useIncompleteDayOutReservations,
  getIncompleteDayOutReservationss,
} from "../controllers/reservations.controller";
import { searchCustomer } from "../controllers/customers.controller";
import { useAddvanceServiceSettings } from "../controllers/additional.service.settings.controller";
import { useIncompleteHallReservations } from "../controllers/hall_reservation.controller";
import { addAdditionalService } from "../controllers/additional.services.controller";

const AdditionalServices = (options) => {
  const [addServData, setAddServData] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [additionalServices, setAadditionalServices] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectRoom, setSelectRoom] = useState("");
  const searchRef = useRef();
  const roomRef = useRef();
  const hallRef = useRef();
  const dayOutRef = useRef();
  const reservationPaymentStatusRef = useRef();
  const updateReservationNotesRef = useRef();

  const [searchCustomerData, setSearchCustomerData] = useState([]);

  const [hallReservations, setHallReservations] = useState([]);
  const [formData, setFormData] = useState({
    customerId: null,
    customerName: null,
    customerType: null,
    dayOutId: null,
    hallId: "",
    roomNo: "",
    roomId: "",
    servicesData: [
      {
        serviceId: "",
        serviceName: "",
        subServiceName: "",
        price: "",
        count: "",
        totalAmount: "",
      },
    ],
    serviceCharge: false,
    finalPrice: null,
    advancedAmount: null,
    balance: null,
    note: null,
  });
  const [serviceList, setServiceList] = useState([]);
  const [subServiceList, setSubServiceList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [additionalServSettingsData, setAdditionalServSettingsData] = useState(
    []
  );
  const [isHidden, setIsHidden] = useState(false);

  const [selectedValue, setSelectedValue] = useState([]);

  //console.log('foemData = > ', formData)

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("name val => ", name, value);
    setFormData((ps) => ({
      ...ps,
      [name]: value,
    }));
  };

  const clearFields = () => {
    setFormData({
      customerId: null,
      customerName: null,
      customerType: null,
      dayOutId: null,
      hallId: "",
      // roomNo: "",
      roomId: "",
      servicesData: [
        {
          serviceId: "",
          serviceName: "",
          subServiceName: "",
          price: "",
          count: "",
          totalAmount: "",
        },
      ],
      serviceCharge: false,
      finalPrice: null,
      advancedAmount: "",
      balance: null,
      note: "",

      customer_name: null,
    });

    if (updateReservationNotesRef?.current) {
      updateReservationNotesRef.current.value = "";
    }
  };

  // function to - Add new row

  const handleInputChange = (index, field, value) => {
    setFormData((prevData) => {
      const servicesData = [...prevData.servicesData];
      servicesData[index] = {
        ...servicesData[index],
        [field]: value,
      };

      if (field === "serviceId") {
        servicesData[index].serviceName = serviceList?.find(
          (d) => d.id === Number(value)
        ).service_name;
        servicesData[index].subServiceName = "";
        servicesData[index].price = "";
        servicesData[index].count = "";
        servicesData[index].totalAmount = "";
      }

      if (field === "subServiceName") {
        const subService = serviceList
          .find((d) => d.id === Number(servicesData[index].serviceId))
          ?.sub_service.find((d) => d.name === value);

        if (subService) {
          servicesData[index].price = subService.price;
        }
      }

      if (field === "count") {
        const price = parseFloat(servicesData[index].price) || 0;
        const count = parseInt(value, 10) || 0;
        servicesData[index].totalAmount = price * count;
      }

      const finalPrice = servicesData.reduce(
        (sum, item) => sum + (parseFloat(item.totalAmount) || 0),
        0
      );

      let advancedAmount = prevData.advancedAmount
        ? parseFloat(prevData.advancedAmount)
        : 0;
      let balance = finalPrice - advancedAmount;

      return {
        ...prevData,
        servicesData,
        finalPrice,
        balance,
      };
    });
  };

  const addRow = () => {
    const serviceRows = [...formData.servicesData];
    serviceRows.push({
      serviceId: "",
      serviceName: "",
      subServiceName: "",
      price: "",
      count: "",
      totalAmount: "",
    });
    setFormData((ps) => ({
      ...ps,
      servicesData: serviceRows,
    }));
  };

  // Remove a row
  const removeRow = (index) => {
    if (formData.servicesData.length > 1) {
      setFormData((prevData) => {
        const newRows = prevData.servicesData.filter((_, i) => i !== index);

        // Recalculate finalPrice
        const finalPrice = newRows.reduce(
          (sum, item) => sum + (parseFloat(item.totalAmount) || 0),
          0
        );

        // Ensure advancedAmount is a valid number before subtracting
        const advancedAmount = parseFloat(prevData.advancedAmount) || 0;
        const balance = finalPrice - advancedAmount;

        return {
          ...prevData,
          servicesData: newRows,
          finalPrice,
          balance,
        };
      });
    }
  };

  const fetchCustomerData = async () => {
    const res = await searchCustomer();
    setSearchCustomerData(res);
    //console.log(res)
  };

  useEffect(() => {
    fetchCustomerData();
    fetchAdditionalServiceData();
  }, []);

  // included new customer search function
  const [state, setState] = useState({
    customerType: null,
    customer: null,
    customerID: null,
    customerName: "",
    hallId: "",
  });
  //const customerId = state.customer?.phone || null;

  const fetchAdditionalServiceData = async () => {
    const res = await useAddvanceServiceSettings();
    setServiceList(res.data);
    //console.log("useAddvanceServiceSettings", res);
  };

  const searchCustomersAsync = async (inputValue) => {
    try {
      if (inputValue) {
        const resp = await searchCustomer(inputValue);
        if (resp.status == 200) {
          return resp.data.map((data) => ({
            label: `${data.name} - (${data.phone})`,
            value: data.phone,
          }));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const {
    APIURL: roomsAPIURL,
    data: RoomsData = [],
    error,
    isLoading: isLoadingRooms,
  } = useRoomReservationsPOS();

  const [dayOutData, setDayOutData] = useState([]);
  const fetchDayOutData = async () => {
    try {
      const response = await getIncompleteDayOutReservationss();
      //console.log(" Raw API Response:", response);

      if (response.status === 200 && response.data) {
        const fetchedData = response.data?.data || [];
        setDayOutData(Array.isArray(fetchedData) ? fetchedData : []);
        //console.log(" Final dayOutData:", fetchedData);
      } else {
        console.error("Unexpected API response:", response);
        setDayOutData([]);
      }
    } catch (error) {
      console.error("Error fetching Day Out Data:", error);
      setDayOutData([]);
    }
  };

  useEffect(() => {
    fetchDayOutData();
  }, []);

  const {
    data: hallReservationsData,
    error: e,
    isLoading,
    APIURL,
  } = useIncompleteHallReservations();

  const handleHallReservationChange = (e) => {
    const selectedHall = JSON.parse(e.target.value);
    //console.log("Selected Room Details:", selectedHall);

    if (selectedHall) {
      setSelectRoom(selectedHall.hall_id);

      setState((prevState) => ({
        ...prevState,
        customer: {
          phone: selectedHall.customer_id,
          name: selectedHall.customer_name,
        },
        customerType: "CUSTOMER",
        customerId: selectedHall.customer_id,
      }));
    }
  };

  const groupWithServiceArray = (arr) => {
    const serviceMap = new Map();

    arr.forEach(({ serviceName, subServiceName, price, count }) => {
      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, { serviceName, subServices: [] });
      }

      const service = serviceMap.get(serviceName);
      const existingSubService = service.subServices.find(
        (sub) => sub.name === subServiceName
      );

      if (existingSubService) {
        existingSubService.count += parseInt(count, 10);
      } else {
        service.subServices.push({
          name: subServiceName,
          price,
          count: parseInt(count, 10),
        });
      }
    });

    return Array.from(serviceMap.values());
  };

  const addAdditionalServicesBtn = async () => {
    console.log("form data", formData);

    const {
      customerId,
      // customerType,
      dayOutId,
      weddingReservationId,
      roomNo,
      reservationId,
      servicesData,
      advancedAmount,
      hallId,
      note,
      roomId,
    } = formData;

    const formattedServicesData = groupWithServiceArray(servicesData);

    const submitData = {
      customerId: customerId || "",
      customerType: customerId ? "CUSTOMER" : "WAKING",
      dayOutReservationId: dayOutId || "",
      weddingReservationId: weddingReservationId || "",
      //roomNo: roomNo || "",
      roomNo: roomId || "",
      reservationId: reservationId || "",
      servicesData: formattedServicesData,
      advancedAmount: advancedAmount || 0,
      hallId: hallId || "",
      note: note || "",
    };

    try {
      toast.loading("Please wait...");

      const res = await addAdditionalService(submitData);
      console.log("added data", res);
      if (res?.status === 200) {
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

  const handleAdvancedAmountChange = (e) => {
    const updatedAdvancedAmount = e.target.value;
    setFormData((prevData) => {
      const newBalance = prevData.finalPrice - updatedAdvancedAmount;
      return {
        ...prevData,
        advancedAmount: updatedAdvancedAmount,
        balance: newBalance,
      };
    });
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center gap-6">
        {/* <h3 className="text-3xl font-light">Additional Services </h3> */}
        {/* <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
        >Hall ID
          <IconPlus size={22} stroke={iconStroke} /> New
        </button> */}
        <div className=" ">
          {/* <h3 className="font-bold text-lg">{`${formData.storeId ? 'Edit' : 'Add'}  Store`}</h3> */}
          <h3 className="text-3xl font-light"> Add Additional Service</h3>

          <div className="flex flex-col gap-4">
            <div className="mt-4">
              <label
                htmlFor="customer"
                className="mb-1 block text-gray-500 text-sm"
              >
                Select Customer{" "}
              </label>

              <AsyncCreatableSelect
                menuPlacement="auto"
                loadOptions={searchCustomersAsync}
                isClearable
                noOptionsMessage={(v) => {
                  return "Type something to find...";
                }}
                onChange={(v) => {
                  // setCustomer(v);
                  console.log("vvvvvvvv", v);
                  setFormData((ps) => ({
                    ...ps,
                    customerId: v?.value || "WAKING",

                    customerType: v?.value || "WAKING",
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-3 justify-center gap-6 ">
              {/* <select
                disabled={formData.dayOutId || formData.hallId}
              
                value={formData.roomId}
                onChange={handleChange}
                name='roomNo'
                className="w-full px-4 py-2 mt-3 text-sm text-gray-500 border rounded-lg bg-gray-50 outline-restro-border-green-light"
              >
                <option value="">Select Room</option>
                {RoomsData.map((room, index) => {
                  return (
                    <option key={index} value={room.id}>
                      
                      {room.room_no} -{room.customer_name} (Bed Count:{" "}

                      {room.bed_count})
                    </option>
                  );
                })}
              </select> */}

              <select
                disabled={formData.dayOutId || formData.hallId}
                value={formData.roomId}
                onChange={handleChange}
                name="roomId"
                className="w-full px-4 py-2 mt-3 text-sm text-gray-500 border rounded-lg bg-gray-50 outline-restro-border-green-light"
              >
                <option value="">Select Room</option>
                {RoomsData?.map((room, index) => (
                  <option key={index} value={room.room_no}>
                    {room.room_no} - {room.customer_name} (Bed Count:{" "}
                    {room.bed_count})
                  </option>
                ))}
              </select>

              <select
                disabled={formData.roomId || formData.hallId}
                value={formData.dayOutId}
                onChange={handleChange}
                name="dayOutId"
                className="w-full px-4 py-2 mt-3 text-sm text-gray-500 border rounded-lg bg-gray-50 outline-restro-border-green-light"
              >
                <option value="">Select Day Out</option>
                {dayOutData?.map((dayOut, index) => {
                  return (
                    // <option key={index} value={dayOut.id}>
                    //   {dayOut.package_id} -{dayOut.customer_name} (Day Out:{" "}
                    //   {dayOut.guest_count})
                    // </option>
                    <option key={dayOut.id} value={dayOut.reservation_id}>
                      {dayOut.reservation_id} - {dayOut.package_name}
                    </option>
                  );
                })}
              </select>

              <select
                disabled={formData.roomId || formData.dayOutId}
                value={formData.hallId}
                onChange={handleChange}
                name="hallId"
                className="w-full px-4 py-2 mt-3 text-sm text-gray-500 border rounded-lg bg-gray-50 outline-restro-border-green-light"
              >
                <option value="">Select Hall</option>
                {/* {hallReservationsData?.map((hall, index) => {
                  return (
                    <option key={index} value={hall.hall_id}>
                      {hall.hall_name}
                    </option>
                  );
                })} */}
              </select>
            </div>

            <div>
              <div>
                {formData?.servicesData?.map((row, index) => (
                  <div
                    key={index}
                    className="flex justify-center gap-6 items-end mb-2"
                  >
                    <div className="flex-1">
                      <label className="mb-1 block text-gray-500 text-sm">
                        Select Main Service
                      </label>
                      <select
                        value={row.serviceId}
                        onChange={(e) =>
                          handleInputChange(index, "serviceId", e.target.value)
                        }
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      >
                        <option value="" disabled>
                          Select a Service
                        </option>
                        {serviceList?.map((service) => (
                          <option
                            key={service.id}
                            data-name={service.service_name}
                            value={service.id}
                          >
                            {service.service_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="mb-1 block text-gray-500 text-sm">
                        Select Sub Service
                      </label>
                      <select
                        value={row.subServiceName}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "subServiceName",
                            e.target.value
                          )
                        }
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      >
                        <option value="" disabled>
                          Select a Sub Service
                        </option>

                        {/* Filter Sub Services Based on Selected Main Service */}
                        {serviceList
                          .find((d) => d.id === Number(row.serviceId))
                          ?.sub_service.map((subservice, i) => (
                            <option key={i} value={subservice.name}>
                              {subservice.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="mb-1 block text-gray-500 text-sm">
                        Price{" "}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={row.price}
                        // onChange={(e) => handleInputChange(index, "price", e.target.value)}
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                        placeholder="Price for Sub Service"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="mb-1 block text-gray-500 text-sm">
                        {" "}
                        Count
                      </label>
                      <input
                        type="number"
                        value={row.count}
                        onChange={(e) =>
                          handleInputChange(index, "count", e.target.value)
                        }
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                        placeholder="Enter Person Count"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="mb-1 block text-gray-500 text-sm">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        // value={row.priceAmount && row.personCount ? row.priceAmount * row.personCount : ""}
                        value={
                          row.price && row.count ? row.price * row.count : ""
                        }
                        readOnly
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                        placeholder="Total Amount"
                      />
                    </div>
                    {formData.servicesData.length > 1 && (
                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-2">
                <button
                  onClick={addRow}
                  className="px-4 py-2 rounded-lg bg-restro-green/80 text-white hover:bg-restro-green/80 transition"
                >
                  Add New Service
                </button>
              </div>

              <div className="flex justify-center gap-6 items-end mt-4">
                {!(formData.roomId || formData.dayOutId || formData.hallId) && (
                  <div className="flex-1 mt-3">
                    <label className="mb-1 block text-gray-500 text-sm">
                      Advanced Amount
                    </label>
                    <input
                      value={formData.advancedAmount}
                      onChange={handleAdvancedAmountChange}
                      type="text"
                      name="dayOutReservationId"
                      className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      placeholder="Enter Advanced Amount"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <label className="mb-1 block text-gray-500 text-sm">
                    {" "}
                    Balance
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.balance || ""}
                    // onChange={(e) => handleInputChange(index, "balance", e.target.value)}
                    className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                    placeholder=" Balance amount"
                  />
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="finalPrice"
                    className="mb-1 block text-gray-500 text-sm"
                  >
                    {" "}
                    Final Price
                  </label>
                  <input
                    type="text"
                    readOnly
                    name="finalPrice"
                    value={formData.finalPrice || ""}
                    // onChange={handleChange}
                    className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                    placeholder=" Final Price for all the Services"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="my-4">
            <label htmlFor="notes" className="mb-1 block text-gray-500 text-sm">
              Notes
            </label>
            <textarea
              ref={updateReservationNotesRef}
              // type="text"
              // value={formData.note}
              name="note"
              placeholder="Enter Notes Here..."
              className="w-full block h-24 text-sm border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button
                onClick={() => clearFields()}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addAdditionalServicesBtn();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default AdditionalServices;
