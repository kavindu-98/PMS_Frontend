/** @format */

import React, { useRef, useState, Fragment, useEffect } from "react";
import Page from "../components/Page";
import {
  IconFilter,
  IconPlus,
  IconSearch,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { iconStroke } from "../config/config";
import { toast } from "react-hot-toast";
import { mutate } from "swr";
import moment from "moment";
import { CURRENCIES } from "../config/currencies.config";
import { searchCustomer } from "../controllers/customers.controller";
import CustomerCard from "../components/CustomerCard";
import {
  usePackageItems,
  useDayOutReservationsInit,
} from "../controllers/dayOutReservation.controller";
import { addQuotation } from "../controllers/quotaion.controller";
import {
  useHalls,
  useRooms,
  useWeddingPackages,
  useServiceCharge,
} from "../controllers/settings.controller";
import { SCOPES } from "../config/scopes";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
import AsyncCreatableSelect from "react-select/async-creatable";
import DialogAddCustomer from "../components/DialogAddCustomer";
import { useAddvanceServiceSettings } from "../controllers/additional.service.settings.controller";
import { setDetailsForQuotationReceiptPrint } from "../helpers/ReceiptHelper";
import { getOrdersInit } from "../controllers/orders.controller";

export default function QuotationAddPage() {
  const { role, scope } = getUserDetailsInLocalStorage();
  const userScopes = scope?.split(",");
  let isManageAllowed = false;
  if (role == "admin") {
    isManageAllowed = true;
  } else {
    if (
      userScopes.includes(SCOPES.MANAGE_QUOTATIONS) ||
      userScopes.includes(SCOPES.QUOTATIONS)
    ) {
      isManageAllowed = true;
    }
  }

  const {
    data: RoomsData,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useRooms();

  const {
    APIURL: APIURLPackages,
    pkgs: pkgs,
    error: errorPackages,
    isLoading: isLoadingPackages,
  } = useWeddingPackages();

  const now = new Date();
  const defaultDateFrom = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const defaultDateTo = `${now.getFullYear()}-${(now.getMonth() + 2)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

  //  Fetch and set service charge percentage from backend
  const { data: serviceChargeData } = useServiceCharge();

  const customerSearchRef = useRef();
  const packageIdRef = useRef();
  const checkInDateRef = useRef();
  const checkOutDateRef = useRef();
  const roomPrice = useRef();
  const finalPriceRef = useRef(null);
  const reservationNotesRef = useRef();
  const mainServiceIdRef = useRef();
  const subServiceNameRef = useRef();

  // State variables for form inputs
  const [nights, setNights] = useState(0);
  const [roomId, setRoomId] = useState("");
  const [roomType, setRoomType] = useState("");
  const [roomTax, setRoomTax] = useState("");
  const [roomTaxAmount, setRoomTaxAmount] = useState("");
  const [bookingType2, setBookingType] = useState("");
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [subServices, setSubServices] = useState([]);
  const [selectedSubService, setSelectedSubService] = useState("");
  const [price, setPrice] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedHallPackageId, setSelectedHallPackageId] = useState("");
  const [price1, setPrice1] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [pricePerPersonHall, setPricePerPersonHall] = useState(0);
  const [finalTotalPrice, setFinalTotalPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [peopleCount, setPeopleCount] = useState(0);
  const [weddingPackageName, setWeddingPackageName] = useState("");
  const [additionalPackageName, setadditionalPackageName] = useState("");
  const [dayoutPackageName, setdayoutPackageName] = useState("");
  const [selectedType, setSelectedType] = useState(null);

  const { data: packageItems, isLoading: isPackageLoading } = usePackageItems(); // Fetch packages
  const [bookingDetails, setBookingDetails] = useState([]);
  const Booking_category = [
    { key: "full_board", value: "FULL BOARD" },
    { key: "half_board", value: "HALF BOARD" },
    { key: "bb", value: "BB" },
    { key: "room_only", value: "ROOM ONLY" },
  ];

  const [state, setState] = useState({
    customer: null,
    customerID: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    addCustomerDefaultValue: null,
    addReservationSelectedBranch: null,
    currency: null,
    printSettings: null,
    storeSettings: null,
  });

  useEffect(() => {
    _init();
    _initSocket();
  }, []);

  const _initSocket = () => {
    console.log("Initializing socket...");
    // Add your socket initialization logic here
  };

  const { storeSettings, isLoading, currency, printSettings } = state;

  const _init = async () => {
    try {
      const ordersInitResponse = await getOrdersInit(); // Fix: No destructuring

      if (ordersInitResponse.status === 200) {
        const ordersInit = ordersInitResponse.data;

        const currency = CURRENCIES.find(
          (c) => c.cc === ordersInit?.storeSettings?.currency
        );

        setState((prevState) => ({
          ...prevState,
          storeSettings: ordersInit.storeSettings || {},
          printSettings: ordersInit.printSettings || {},
          currency: currency?.symbol,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error loading orders! Please try later!");

      setState((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
    }
  };

  const handlePackageChange = (e) => {
    const selectedId = parseInt(e.target.value, 10) || 0;
    setSelectedPackageId(selectedId);

    const selectedPackage = packageItems.find((pkg) => pkg.id === selectedId);

    setRoomTax(
      selectedPackage && selectedPackage.tax_type === "exclusive"
        ? selectedPackage.tax_rate
        : 0
    );
    if (selectedPackage) {
      setPricePerPerson(parseFloat(selectedPackage.price_per_person) || 0);
      setdayoutPackageName(selectedPackage.name);
      setSelectedType("dayout");
    } else {
      setPricePerPerson(0);
      setSelectedType(null);
    }
  };

  const handlePackageChangeHall = (e) => {
    const selectedId = parseInt(e.target.value, 10) || 0;
    setSelectedHallPackageId(selectedId);

    const selectedPackage = pkgs.find(
      (pkg) => pkg.wedding_package_id === selectedId
    );

    setRoomTax(
      selectedPackage && selectedPackage.tax.tax_type === "exclusive"
        ? selectedPackage.tax.tax_rate
        : 0
    );
    if (selectedPackage) {
      setPricePerPersonHall(parseFloat(selectedPackage.price_per_person) || 0);
      setWeddingPackageName(selectedPackage.wedding_package_name);
      setSelectedType("wedding");
    } else {
      setPricePerPersonHall(0);
      setWeddingPackageName("");
      setSelectedType(null);
    }
  };

  const handlePeopleCountChange = (e) => {
    const value = e.target.value;
    setPeopleCount(value === "" ? "" : Math.max(0, Number(value))); // Ensure non-negative values
  };

  // Handle final price change
  const handleFinalPriceChange = (e) => {
    const finalPrice = e.target.value;
    setFinalPrice(finalPrice);
  };

  useEffect(() => {
    async function fetchServices() {
      const res = await useAddvanceServiceSettings();
      if (res.success) {
        setServices(res.data);
      }
    }
    fetchServices();
  }, []);

  const handleRoomDetails = (e) => {
    const selectedRoomId = e.target.value;
    setRoomId(selectedRoomId);
    const selectedRoom = RoomsData.find(
      (room) => room.room_no === selectedRoomId
    );
    setRoomType(selectedRoom ? selectedRoom.room_category : "");
    // Set room tax based on tax_type
    setRoomTax(
      selectedRoom && selectedRoom.tax_type === "exclusive"
        ? selectedRoom.tax_rate
        : 0
    );

    if (selectedRoomId) {
      setSelectedType("room"); // Mark that a room has been selected
    } else {
      setSelectedType(null);
    }

    // Reset price when room changes
    setPrice("");
  };

  const handleBookingTypeChange = (e) => {
    const selectedBookingType = e.target.value;
    setBookingType(selectedBookingType);

    // Update price based on selected room and booking type
    if (roomId && selectedBookingType) {
      const selectedRoom = RoomsData.find((room) => room.room_no === roomId);
      if (selectedRoom && selectedRoom[selectedBookingType]) {
        setPrice1(selectedRoom[selectedBookingType]);
      } else {
        setPrice1("");
      }
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) return 0; // Ensure checkout is after check-in

    const diffTime = checkOutDate - checkInDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24); // Convert milliseconds to days
    return Math.ceil(diffDays); // Rounds up to avoid partial nights
  };

  const handleCheckInChange = (e) => {
    const value = e.target.value;
    setCheckIn(value);
    setNights(calculateNights(value, checkOut));
  };

  const handleCheckOutChange = (e) => {
    const value = e.target.value;
    setCheckOut(value);
    setNights(calculateNights(checkIn, value));
  };

  // Calculate Final Price
  useEffect(() => {
    const totalPrice =
      price1 * nights +
      pricePerPerson * peopleCount +
      price * peopleCount +
      pricePerPersonHall * peopleCount;

    setFinalPrice(totalPrice);
  }, [price1, nights, pricePerPerson, price, pricePerPersonHall, peopleCount]);

  const handleAddBooking = (e) => {
    e.preventDefault();
    let unitPrice = 0;

    if (roomId) {
      unitPrice = price1 * nights; // roomPrice * nights
    } else if (selectedPackageId) {
      unitPrice = pricePerPerson; // packagePrice
    } else if (selectedHallPackageId) {
      unitPrice = pricePerPersonHall; // hallPackagePrice
    } else if (selectedServiceId) {
      unitPrice = price; // servicePrice
    }

    // Format dates to "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
      const dateObj = new Date(date);
      return moment(dateObj).format("YYYY-MM-DD HH:mm:A");
    };

    console.log("roomTax.tax_rate:", roomTax);
    console.log("finalPrice (before conversion):", finalPrice);

    const numericFinalPrice = Number(finalPrice) || 0; // Convert to number and default to 0 if NaN
    const taxAmount = (numericFinalPrice * roomTax) / 100;

    setRoomTaxAmount(taxAmount);
    console.log("Calculated roomTaxAmount:", taxAmount);

    const checkInDate = formatDateTime(checkIn);
    const checkOutDate = formatDateTime(checkOut);

    // Create a booking object from the current state values.  Do *not* use formData directly, as it may not be up-to-date.
    const newBooking = {
      customer: state.customer,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      roomId: roomId,
      roomType: roomType,
      roomTaxAmount: taxAmount,
      bookingCategory: bookingType2,
      price: price1,
      nights: nights,
      packageId: selectedPackageId,
      pricePerPerson: pricePerPerson,
      serviceId: selectedServiceId,
      subService: selectedSubService,
      servicePrice: price,
      hallPackageId: selectedHallPackageId,
      peopleCount: peopleCount,
      finalPrice: finalPrice,
      notes: notes,
      unitPrice: unitPrice, //Add the unit price to the booking object
    };

    // Add the new booking object to bookingDetails
    setBookingDetails((prevDetails) => [...prevDetails, newBooking]);
    resetForm();
  };

  useEffect(() => {
    const subtotal = bookingDetails.reduce(
      (acc, booking) => acc + (parseFloat(booking.finalPrice) || 0),
      0
    );

    const totalTax = bookingDetails.reduce(
      (acc, booking) => acc + (parseFloat(booking.roomTaxAmount) || 0),
      0
    );

    setSubTotal(subtotal);

    const serviceChargeAmt =
      (subtotal * serviceChargeData?.ServiceCharges) / 100 || 0;
    setServiceCharge(serviceChargeAmt);

    setTotalTax(totalTax);
    setFinalTotalPrice(totalTax + subtotal + serviceChargeAmt);
  }, [bookingDetails]);

  const btnPrintReceipt = async () => {
    if (bookingDetails.length === 0) {
      toast.error("Please add at least one quotation.");
      return;
    }

    try {
      toast.loading("Preparing receipt...");

      toast.dismiss();

      const page_format = printSettings?.page_format || null;
      const is_enable_print = printSettings?.is_enable_print || 0;

      const detailsForReceipt = {
        bookingDetails: bookingDetails?.map((booking) => ({
          ...booking,
          weddingPackageName: weddingPackageName, // Pass the weddingPackageName
          dayoutPackageName: dayoutPackageName, // Pass the dayoutPackageName
          additionalPackageName: additionalPackageName, //Pass additionalPackageName
        })),
        subtotal: subTotal,
        taxTotal: totalTax,
        serviceCharge: serviceCharge,
        finalTotal: finalTotalPrice,
        storeSettings: storeSettings,
        printSettings: printSettings,
        currency: currency,
        customer: state.customer,
      };

      setDetailsForQuotationReceiptPrint(detailsForReceipt);
      if (is_enable_print) {
        const receiptWindow = window.open(
          "/print-quotation-receipt",
          "_blank",
          "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
        );
        receiptWindow.onload = (e) => {
          setTimeout(() => {
            receiptWindow.print();
          }, 400);
        };
        return;
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Error processing your request, Please try later!";
      toast.dismiss();
      console.error(error);
      toast.error(message);
    }
  };

  if (isPackageLoading) {
    return <Page>Please wait...</Page>;
  }

  const setCustomer = (customer) => {
    if (customer) {
      setState({
        ...state,
        customer: { phone: customer.value, name: customer.label },
      });
    } else {
      clearSelectedCustomer();
    }
  };

  const searchCustomersAsync = async (inputValue) => {
    try {
      if (inputValue) {
        const resp = await searchCustomer(inputValue);
        if (resp.status == 200) {
          return resp.data?.map((data) => ({
            label: `${data.name} - (${data.phone})`,
            value: data.phone,
          }));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const clearSelectedCustomer = () => {
    setState({
      ...state,
      customer: null,
    });
  };

  const resetForm = () => {
    setState({
      ...state,
      customer: null,
    });

    setSelectedType(null);
    setRoomId("");
    setRoomType("");
    setRoomTax("");
    setBookingType("");
    setPrice1("");
    setNights(0);
    setSelectedPackageId("");
    setPricePerPerson(0);
    setSelectedServiceId("");
    setSubServices([]);
    setSelectedSubService("");
    setPrice("");
    setCheckIn("");
    setCheckOut("");
    setNotes("");
    setSelectedHallPackageId("");
    setPeopleCount(0);
    setFinalTotalPrice(0);
    setFinalPrice(0);
    if (roomPrice.current) roomPrice.current.value = "";
    if (checkInDateRef.current) checkInDateRef.current.value = "";
    if (checkOutDateRef.current) checkOutDateRef.current.value = "";
    if (reservationNotesRef.current) reservationNotesRef.current.value = "";
    if (mainServiceIdRef.current) mainServiceIdRef.current.value = "";
    if (subServiceNameRef.current) subServiceNameRef.current.value = "";
  };

  const resetTable = () => {
    clearSelectedCustomer();
    setBookingDetails([]);
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    setSelectedServiceId(serviceId);
    setSelectedSubService("");
    setPrice("");

    const selectedService = services.find((service) => service.id == serviceId);

    setRoomTax(
      selectedService && selectedService.type === "exclusive"
        ? selectedService.rate
        : 0
    );
    if (selectedService) {
      setSubServices(selectedService.sub_service || []);
      setadditionalPackageName(selectedService.service_name);
      setSelectedType("service");
    } else {
      setSubServices([]);
      setSelectedType(null);
    }
  };

  const handleSubServiceChange = (e) => {
    const subServiceName = e.target.value;
    setSelectedSubService(subServiceName);

    const selectedSub = subServices.find((sub) => sub.name === subServiceName);
    if (selectedSub) {
      setPrice(selectedSub.price);
    } else {
      setPrice("");
    }
  };

  const btnSaveQuotation = async () => {
    if (bookingDetails.length === 0) {
      toast.error("Please add at least one reservation for quotation.");
      return;
    }

    console.log("bookingDetails Data:", bookingDetails);

    // Format dates to "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
      return moment(date, ["YYYY-MM-DD hh:mm:A", "YYYY-MM-DD HH:mm:ss"]).format(
        "YYYY-MM-DD HH:mm:ss"
      );
    };

    // Transform bookingDetails to match API request format
    const transformedData = {
      total: finalTotalPrice.toString(),
      service_charge: serviceCharge.toString(),
      TAX: totalTax.toString(),
      sub_total: subTotal.toString(),
      service: bookingDetails.map((item) => ({
        customer_id: item.customer.phone || "",
        service_id: item.serviceId || item.roomId || "",
        q_type: item.roomId ? "room" : "service",
        description: item.subService || item.roomType || "none",
        people_count: item.peopleCount.toString(),
        amount: (item.finalPrice || 0).toFixed(2),
        unit_price: (item.unitPrice || 0).toFixed(2),
        exclude_price: (item.servicePrice || item.price || 0).toFixed(2),
        check_in: formatDateTime(item.checkIn),
        check_out: formatDateTime(item.checkOut),
      })),
    };

    console.log("Transformed Data:", transformedData);

    try {
      const res = await addQuotation({ transformedData });
      if (res.status === 200) {
        toast.success(res.data.message);
        toast.dismiss();
        resetTable();
        // console.log("res message", res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  };

  return (
    <Page>
      <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-6">
          <h3 className="text-2xl">Add Quotation</h3>
        </div>
        <div className="flex gap-2"></div>
      </div>

      <DialogAddCustomer
        defaultValue={state.addCustomerDefaultValue}
        branchId={state.addReservationSelectedBranch}
        role={role}
        onSuccess={(phone, name) => {
          setCustomer({ value: phone, label: `${name} - (${phone})` });
        }}
      />
      <div className="p-6 m-6 border rounded-lg bg-zinc-50">
        <div className="flex flex-col gap-4 ">
          <div className="mt-4">
            <label
              htmlFor="customer"
              className="block mb-1 text-sm text-gray-500"
            >
              Select Customer{" "}
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>

            <AsyncCreatableSelect
              menuPlacement="auto"
              loadOptions={searchCustomersAsync}
              isClearable
              noOptionsMessage={(v) => {
                return "Type something to find...";
              }}
              onChange={(v) => {
                setCustomer(v);
              }}
              onCreateOption={(inputValue) => {
                setState({
                  ...state,
                  addCustomerDefaultValue: inputValue,
                });
                document.getElementById("modal-add-customer").showModal();
              }}
            />
          </div>

          <div className="mt-4">
            {state.customer && (
              <CustomerCard
                phone={state.customer.phone}
                name={state.customer.name}
                // email={state.customer.email}
                birth_date={state.customer.birth_date}
                gender={state.customer.gender}
                // created_at={state.customer.created_at}
                btnAction={() => {
                  clearSelectedCustomer();
                }}
              />
            )}
          </div>

          <div className="flex w-full gap-4 ">
            <div className="flex-1">
              <label
                htmlFor="checkIn"
                className="block mb-1 text-sm text-gray-500"
              >
                Check In{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                // ref={checkInDateRef}
                type="datetime-local"
                name="date"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Check In"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
                value={checkIn} // Controlled Component
                onChange={handleCheckInChange}
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="checkOut"
                className="block mb-1 text-sm text-gray-500"
              >
                Check Out{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                // ref={checkOutDateRef}
                type="datetime-local"
                name="date"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Check Out"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
                value={checkOut} // Controlled Component
                onChange={handleCheckOutChange}
              />
            </div>
          </div>
          {selectedType !== "dayout" &&
            selectedType !== "service" &&
            selectedType !== "wedding" && (
              <>
                <h5 className="block mt-4 text-sm font-semibold text-gray-600">
                  Add Room
                </h5>
                <div className="flex w-full gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="roomNo"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Room
                    </label>
                    <select
                      value={roomId} // Controlled Component
                      name="room"
                      onChange={handleRoomDetails}
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      placeholder="Select Room"
                      disabled={
                        selectedType === "dayout" ||
                        selectedType === "service" ||
                        selectedType === "wedding"
                      }
                    >
                      <option value="">Select Room</option>
                      {RoomsData && RoomsData?.length > 0 ? (
                        RoomsData.map((room) => (
                          <option key={room.id} value={room.room_no}>
                            {room.room_no} {room.room_category} (Bed Count:{" "}
                            {room.bed_count})
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading rooms...</option>
                      )}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label
                      htmlFor="roomType"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Room Type
                    </label>
                    <input
                      value={roomType} // Controlled Component
                      type="text"
                      name="roomType"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      disabled
                    />
                  </div>
                </div>
                <div className="flex w-full gap-4 mt-4">
                  <div className="flex-1">
                    <label
                      htmlFor="bookingCategory"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Booking Category
                    </label>
                    <select
                      value={bookingType2} // Controlled Component
                      name="room"
                      onChange={handleBookingTypeChange}
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      placeholder="Select Booking Category"
                      disabled={
                        selectedType === "dayout" ||
                        selectedType === "service" ||
                        selectedType === "wedding"
                      }
                    >
                      <option value="">Select Booking Category</option>
                      {Booking_category?.map((bookingtype, index) => (
                        <option key={index} value={bookingtype.key}>
                          {bookingtype.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="price"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Price Rs.{" "}
                    </label>
                    <input
                      value={price1} // Controlled Component
                      ref={roomPrice}
                      type="number"
                      name="price"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      disabled
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="nights"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      No Of Nights
                    </label>
                    <input
                      type="number"
                      name="nights"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      placeholder="Number Of Nights"
                      value={nights} // Controlled Component
                      readOnly // Make it read-only since it's auto-calculated
                    />
                  </div>
                </div>
              </>
            )}

          {selectedType !== "room" &&
            selectedType !== "service" &&
            selectedType !== "wedding" && (
              <>
                <h5 className="block mt-4 text-sm font-semibold text-gray-600">
                  Add Dayout
                </h5>
                <div className="flex w-full gap-4 ">
                  {/* Package Dropdown */}
                  <div className="flex-1">
                    <label
                      htmlFor="package"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Package
                    </label>
                    <select
                      ref={packageIdRef}
                      name="package"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      value={selectedPackageId} // Controlled Component
                      onChange={handlePackageChange}
                      disabled={
                        selectedType === "room" ||
                        selectedType === "service" ||
                        selectedType === "wedding"
                      }
                    >
                      <option value="">None</option>
                      {packageItems &&
                        packageItems?.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Price Field */}
                  <div className="flex-1">
                    <label
                      htmlFor="price"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Price Rs.
                    </label>
                    <input
                      value={pricePerPerson} // Controlled Component
                      type="number"
                      name="price"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      disabled
                    />
                  </div>
                </div>
              </>
            )}

          {selectedType !== "room" &&
            selectedType !== "dayout" &&
            selectedType !== "wedding" && (
              <>
                <h5 className="block mt-4 text-sm font-semibold text-gray-600">
                  Add Additional Service
                </h5>
                <div className="flex w-full gap-4">
                  {/* Main Service Dropdown */}
                  <div className="flex-1">
                    <label
                      htmlFor="mainService"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Main Service
                    </label>
                    <select
                      ref={mainServiceIdRef}
                      name="mainService"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      value={selectedServiceId} // Controlled Component
                      onChange={handleServiceChange}
                      disabled={
                        selectedType === "room" ||
                        selectedType === "dayout" ||
                        selectedType === "wedding"
                      }
                    >
                      <option value="">None</option>
                      {services?.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.service_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub Service Dropdown */}
                  <div className="flex-1">
                    <label
                      htmlFor="subService"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Sub Service
                    </label>
                    <select
                      name="subService"
                      ref={subServiceNameRef}
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      value={selectedSubService} // Controlled Component
                      onChange={handleSubServiceChange}
                      disabled={
                        !selectedServiceId ||
                        subServices.length === 0 ||
                        selectedType === "room" ||
                        selectedType === "dayout" ||
                        selectedType === "wedding"
                      }
                    >
                      <option value="">None</option>
                      {subServices?.map((sub) => (
                        <option key={sub.name} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Input */}
                  <div className="flex-1">
                    <label
                      htmlFor="price"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Price Rs.
                    </label>
                    <input
                      value={price} // Controlled Component
                      type="number"
                      name="price"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      disabled
                    />
                  </div>
                </div>
              </>
            )}

          {selectedType !== "room" &&
            selectedType !== "service" &&
            selectedType !== "dayout" && (
              <>
                <h5 className="block mt-4 text-sm font-semibold text-gray-600">
                  Add Wedding Hall
                </h5>
                <div className="flex w-full gap-4 ">
                  {/* Adult Count */}
                  <div className="flex-1">
                    <label
                      htmlFor="package"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Package
                    </label>
                    <select
                      value={selectedHallPackageId} // Controlled Component
                      name="package"
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                      placeholder="Select Package"
                      onChange={handlePackageChangeHall}
                      disabled={
                        selectedType === "room" ||
                        selectedType === "dayout" ||
                        selectedType === "service"
                      }
                    >
                      <option value="">None</option>
                      {pkgs?.map((pkg) => (
                        <option
                          value={pkg.wedding_package_id}
                          key={pkg.wedding_package_id}
                        >
                          {pkg.wedding_package_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

          <div className="flex w-full gap-4 mt-4"></div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="peopleCount"
                className="block mb-1 text-sm text-gray-500"
              >
                People Count
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                value={peopleCount}
                type="number"
                name="peopleCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter People Count"
                onChange={handlePeopleCountChange}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="finalPrice"
                className="block mb-1 text-sm text-gray-500"
              >
                Final Price Rs.{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                min={0}
                type="number"
                placeholder={`Enter final price`} //Display the calculated final price as placeholder
                value={finalPrice} //Controlled component, updatestate on change.
                onChange={handleFinalPriceChange}
                name="finalPrice"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              />
            </div>
          </div>

          <div className="my-4">
            <label htmlFor="notes" className="block mb-1 text-sm text-gray-500">
              Notes
            </label>
            <textarea
              ref={reservationNotesRef}
              name="notes"
              value={notes} // Controlled Component
              onChange={(e) => setNotes(e.target.value)} // Handle state update
              placeholder="Enter Notes Here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog" onSubmit={handleAddBooking}>
              {/* if there is a button in form, it will close the modal */}

              <button
                type="submit"
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="p-2 m-4">
        <div className="w-full mt-8">
          <table className="w-full overflow-x-auto border">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                  #
                </th>
                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                  Room/ Package/ Hall/ Service Id
                </th>

                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                  Description
                </th>
                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                  Check In
                </th>
                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                  Check Out
                </th>

                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                  People Count
                </th>
                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                  Unit Price
                </th>

                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                  Amount
                </th>

                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                  Excluded Price
                </th>
                <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bookingDetails?.map((booking, index) => (
                <tr key={index} className="border-b">
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2">
                    {booking.roomId ? (
                      <>
                        Room:{booking.roomId}
                        <br />
                      </>
                    ) : null}
                    {booking.hallPackageId ? (
                      <>
                        Wedding:{booking.hallPackageId}
                        <br />
                      </>
                    ) : null}
                    {booking.packageId ? (
                      <>
                        Dayout:{booking.packageId}
                        <br />
                      </>
                    ) : null}
                    {booking.serviceId ? (
                      <>
                        Service:{booking.serviceId}
                        <br />
                      </>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {booking.roomType ? (
                      <>
                        {booking.roomType}
                        <br />
                      </>
                    ) : null}
                    {booking.bookingCategory ? (
                      <>
                        {booking.bookingCategory}
                        <br />
                      </>
                    ) : null}
                    {booking.hallPackageId ? (
                      <>
                        {weddingPackageName} package
                        <br />
                      </>
                    ) : null}
                    {booking.packageId ? (
                      <>
                        {dayoutPackageName} package
                        <br />
                      </>
                    ) : null}
                    {booking.hallPackageId ? (
                      <>
                        {additionalPackageName} package - {booking.subService}
                        <br />
                      </>
                    ) : null}
                    {booking.notes ? (
                      <>
                        {booking.notes}
                        <br />
                      </>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{booking.checkIn}</td>
                  <td className="px-3 py-2">{booking.checkOut}</td>
                  <td className="px-3 py-2">{booking.peopleCount}</td>
                  <td className="px-3 py-2">{booking.unitPrice}</td>
                  <td className="px-3 py-2">{booking.finalPrice}</td>
                  <td className="px-3 py-2">{booking.finalPrice}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => {
                        setBookingDetails(
                          bookingDetails.filter((_, i) => i !== index)
                        );
                      }}
                      className="flex items-center justify-center px-2 py-1 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                    >
                      <IconTrash stroke={iconStroke} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Subtotal, Tax, Discount, and Total Row */}
              <tr className="font-semibold bg-gray-50">
                <td colSpan="7" className="px-3 py-2 text-start">
                  Subtotal:
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{subTotal?.toFixed(2) || 0.0}</td>
                <td></td>
              </tr>
              <tr className="font-semibold bg-gray-100">
                <td colSpan="7" className="px-3 py-2 text-start">
                  Total Tax:
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{totalTax?.toFixed(2) || 0.0}</td>
                <td></td>
              </tr>
              <tr className="font-semibold bg-gray-50">
                <td colSpan="7" className="px-3 py-2 text-start">
                  Service Charge:
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">
                  {serviceCharge?.toFixed(2) || 0.0}
                </td>
                <td></td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan="7" className="px-3 py-2 text-start">
                  Total:
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">
                  {finalTotalPrice?.toFixed(2) || 0.0}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-300 active:scale-95 hover:shadow-lg"
            onClick={() => btnPrintReceipt()}
          >
            Print Receipt
          </button>
          <button
            className="px-4 py-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
            onClick={() => btnSaveQuotation()}
          >
            Submit
          </button>
        </div>
      </div>
    </Page>
  );
}
