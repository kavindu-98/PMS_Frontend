/** @format */

import React, { useRef, useState, Fragment, useEffect } from "react";
import Page from "../components/Page";
import { IconFilter, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { iconStroke } from "../config/config";
import { toast } from "react-hot-toast";
import { mutate } from "swr";
import moment from "moment";

import { searchCustomer } from "../controllers/customers.controller";
import CustomerCard from "../components/CustomerCard";
import { searchRoomReservations } from "../controllers/reservations.controller";

import {
  usePackageItems,
  addDayOutReservation,
  useDayOutReservationsInit,
  searchDayOutReservations,
  updateDayOutReservation,
  deleteDayOutReservation,
} from "../controllers/dayOutReservation.controller";

import { useRooms } from "../controllers/settings.controller";
import DayOutReservationCard from "../components/DayOutReservationCard";
import { SCOPES } from "../config/scopes";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
import AsyncCreatableSelect from "react-select/async-creatable";
import DialogAddCustomer from "../components/DialogAddCustomer";
import Papa from "papaparse";

export default function DayOutReservation() {
  const { role, scope } = getUserDetailsInLocalStorage();
  const userScopes = scope?.split(",");
  let isManageAllowed = false;
  if (role == "admin") {
    isManageAllowed = true;
  } else {
    if (
      userScopes.includes(SCOPES.MANAGE_DAY_OUT_RESERVATIONS) ||
      userScopes.includes(SCOPES.DAY_OUT_RESERVATIONS)
    ) {
      isManageAllowed = true;
    }
  }

  const filters = [
    { key: "today", value: "Today" },
    { key: "tomorrow", value: "Tomorrow" },
    { key: "yesterday", value: "Yesterday" },
    { key: "last_7days", value: "Last 7 Days" },
    { key: "this_month", value: "This Month" },
    { key: "last_month", value: "Last Month" },
    { key: "custom", value: "Custom" },
  ];

  const searchRef = useRef();
  const fromDateRef = useRef();
  const toDateRef = useRef();
  const filterTypeRef = useRef();

  const now = new Date();
  const defaultDateFrom = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const defaultDateTo = `${now.getFullYear()}-${(now.getMonth() + 2)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const customerSearchRef = useRef();
  const packageIdRef = useRef();
  const checkInDateRef = useRef();
  const checkOutDateRef = useRef();
  const adanceAmtRef = useRef();
  const finalPriceRef = useRef(null);
  const customerIdRef = useRef();
  const reservationPeopleCountRef = useRef(null);
  const reservationStatusRef = useRef();
  const reservationPaymentStatusRef = useRef();
  const reservationNotesRef = useRef();

  const updateReservationIdRef = useRef();

  const updateReservationCheckInDateRef = useRef();
  const updateReservationCheckOutDateRef = useRef();
  const updateReservationFinalPriceRef = useRef();
  const updateReservationpackageIdRefRef = useRef();
  const updateReservationPeopleCountRef = useRef();
  const updateReservationStatusRef = useRef();
  const updateReservationAdvanceAmtRef = useRef();
  const updateReservationPaymentStatusRef = useRef();
  const updateReservationNotesRef = useRef();

  // const [roomId, setRoomId] = useState("");
  // const [roomType, setRoomType] = useState("");
  // const [bookingType2, setBookingType] = useState("");

  const [totalPrice, setTotalPrice] = useState(0);

  const { data: packageItems, isLoading: isPackageLoading } = usePackageItems(); // Fetch packages
  const [selectedPackageId, setSelectedPackageId] = useState(""); // Store selected package ID
  const [price, setPrice] = useState(""); // Store selected package price
  const [pricePerPerson, setPricePerPerson] = useState(0); // Store price per person
  const [advanceAmount, setAdvanceAmount] = useState(0); // Advance amount
  const [finalPrice, setFinalPrice] = useState(0); // Calculated final price
  const [subTotal, setSubTotal] = useState(0); // Calculated final price
  const [peopleCount, setPeopleCount] = useState(0); // People count

  const advanceAmtRef = useRef(null);
  const subTotalRef = useRef(null);

  const handlePackageChange = (e) => {
    const selectedId = parseInt(e.target.value, 10) || 0;
    setSelectedPackageId(selectedId);

    const selectedPackage = packageItems.find((pkg) => pkg.id === selectedId);
    if (selectedPackage) {
      setPricePerPerson(parseFloat(selectedPackage.price_per_person) || 0);
    } else {
      setPricePerPerson(0);
    }
  };

  // Handle people count change
  const handlePeopleCountChange = () => {
    const count = parseInt(reservationPeopleCountRef.current.value, 10) || 0;
    setPeopleCount(count);
  };

  const handleUpdatePeopleCountChange = () => {
    const updateCount =
      parseInt(updateReservationPeopleCountRef.current.value, 10) || 0;
    setPeopleCount(updateCount);
  };
  // Handle advance amount change
  const handleAdvanceAmountChange = () => {
    const advance = parseFloat(advanceAmtRef.current.value) || 0;
    setAdvanceAmount(advance);
  };

  const handleUpdateAdvanceAmountChange = () => {
    const updateAdvance =
      parseFloat(updateReservationAdvanceAmtRef.current.value) || 0;
    setAdvanceAmount(updateAdvance);
  };

  useEffect(() => {
    const finalPrice = pricePerPerson * peopleCount;
    const subTotal = finalPrice - advanceAmount;

    setFinalPrice(finalPrice >= 0 ? finalPrice : 0); // Ensure final price is not negative
    setSubTotal(subTotal >= 0 ? subTotal : 0); // Ensure final price is not negative

    if (subTotalRef.current) {
      subTotalRef.current.value = subTotal >= 0 ? subTotal : 0;
    }

    if (updateReservationFinalPriceRef.current) {
      updateReservationFinalPriceRef.current.value =
        finalPrice >= 0 ? finalPrice : 0;
    }
  }, [pricePerPerson, peopleCount, advanceAmount]); // Run when any of these change

  const [state, setState] = useState({
    search: "",
    searchResults: [],
    spage: 1,
    filter: filters[0].key,
    fromDate: null,
    toDate: null,
    customer: null,
    customerID: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    addCustomerDefaultValue: null,
    addReservationSelectedBranch: null,
  });

  // const {
  //   data: RoomsData,
  //   error: errorRooms,
  //   isLoading: isLoadingRooms,
  // } = useRooms();

  const {
    APIURL,
    data: reservations,
    error,
    isLoading,
  } = useDayOutReservationsInit({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
  });

  if (isPackageLoading) {
    return <Page>Please wait...</Page>;
  }

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please try later!</Page>;
  }

  const btnSearch = async () => {
    const searchQuery = searchRef.current.value;
    if (!new String(searchQuery).trim()) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await searchDayOutReservations(
        new String(searchQuery).trim()
      );
      if (res.status == 200) {
        toast.dismiss();
        setState({
          ...state,
          search: searchQuery,
          searchResults: res.data,
          spage: 1,
        });
      } else {
        toast.dismiss();
        toast.error("No result found!");
      }
    } catch (error) {
      console.error(error);
      const message =
        error.response.data.message || "Something went wrong! Try later!";

      toast.dismiss();
      toast.error(message);
    }
  };
  const btnClearSearch = () => {
    searchRef.current.value = null;

    setState({
      ...state,
      search: "",
      searchResults: [],
      spage: 1,
    });
  };

  const btnSearchCustomer = async () => {
    const customerSearch = customerSearchRef.current.value;

    if (!customerSearch) {
      toast.error("Please provide customer phone number to search!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await searchCustomer(customerSearch);
      if (res.status == 200) {
        toast.dismiss();

        const customer = res.data;
        setState({
          ...state,
          customer: customer,
        });
      } else {
        toast.dismiss();
        toast.error(res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      toast.dismiss();
      toast.error(message);
    }
  };

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

  const clearSelectedCustomer = () => {
    setState({
      ...state,
      customer: null,
    });
  };

  const btnAdd = async () => {
    // Ensure refs are initialized before accessing their values
    const package_id = packageIdRef?.current?.value || null;
    const customerId = state.customer?.phone || null;
    const checkInDateRaw = checkInDateRef?.current?.value || null;
    const checkOutDateRaw = checkOutDateRef?.current?.value || null;
    const finalPrice = finalPriceRef?.current?.value || null;
    // const subTotal = subTotalRef?.current?.value || null;
    const guestCount = reservationPeopleCountRef?.current?.value || null;
    const advancedAmount = advanceAmtRef?.current?.value || null;
    const status = reservationStatusRef?.current?.value || null;
    const paymentStatus = reservationPaymentStatusRef?.current?.value || null;
    const note = reservationNotesRef?.current?.value || null;

    if (!package_id) {
      toast.error("Please select a package!");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer!");
      return;
    }
    if (!checkInDateRaw) {
      toast.error("Please select a check-in date & time!");
      return;
    }
    if (!checkOutDateRaw) {
      toast.error("Please select a check-out date & time!");
      return;
    }

    // Format dates to "YYYY-MM-DD HH:mm:ss"
    const formatDateTime = (date) => {
      const dateObj = new Date(date);
      return moment(dateObj).format("YYYY-MM-DD HH:mm:ss");
    };

    const checkInTime = formatDateTime(checkInDateRaw);
    const checkOutTime = formatDateTime(checkOutDateRaw);

    // Prepare payload with default paymentType
    const payload = {
      package_id: parseInt(package_id),
      customerId,
      checkInTime,
      checkOutTime,
      guestCount,
      status,
      paymentStatus,
      note,
      advancedAmount,
      finalPrice,
      // subTotal,
      paymentType: "manual", // Default payment type
    };

    console.log("Payload:", payload);

    // Send to API
    try {
      const res = await addDayOutReservation(payload);

      if (res.status === 200) {
        toast.success(res.data.message);

        // Clear form fields safely
        if (checkInDateRef?.current) checkInDateRef.current.value = "";
        if (checkOutDateRef?.current) checkOutDateRef.current.value = "";
        if (advanceAmtRef?.current) advanceAmtRef.current.value = "";
        if (finalPriceRef?.current) finalPriceRef.current.value = "";
        if (subTotalRef?.current) subTotalRef.current.value = "";
        if (packageIdRef?.current) packageIdRef.current.value = "";
        if (reservationPeopleCountRef?.current)
          reservationPeopleCountRef.current.value = "";
        if (reservationStatusRef?.current)
          reservationStatusRef.current.value = "";
        if (reservationPaymentStatusRef?.current)
          reservationPaymentStatusRef.current.value = "";
        if (reservationNotesRef?.current)
          reservationNotesRef.current.value = "";

        // Reset states
        setSelectedPackageId("");
        setPricePerPerson(0);
        setAdvanceAmount(0);
        setFinalPrice(0);
        setSubTotal(0);
        setPeopleCount(0);
        clearSelectedCustomer();
        setCustomer();
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
        console.log("res message", res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  };

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteDayOutReservation(id);

      if (res.status == 200) {
        await mutate(APIURL);
        setState({
          ...state,
          searchResults: state.searchResults.filter((s) => s.id != id),
        });
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };

  const btnShowUpdate = (
    id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    dateFormatted1,
    dateFormatted2,
    final_price,
    guest_count,
    status,
    advanced_amount,
    note,
    package_id,
    paymentStatus
  ) => {
    updateReservationIdRef.current.value = id;

    // Set customer details
    setState({
      ...state,
      customerID: customer_id,
      customerName: customer_name,
      customerPhone: customer_phone,
      customerEmail: customer_email,
    });

    updateReservationpackageIdRefRef.current.value = package_id;
    updateReservationCheckInDateRef.current.value = dateFormatted1;
    updateReservationCheckOutDateRef.current.value = dateFormatted2;
    updateReservationPeopleCountRef.current.value = guest_count || 0;
    updateReservationFinalPriceRef.current.value = final_price;
    updateReservationStatusRef.current.value = status;
    updateReservationAdvanceAmtRef.current.value = advanced_amount;
    updateReservationPaymentStatusRef.current.value = paymentStatus;
    updateReservationNotesRef.current.value = note;

    // **Set State for Package ID, People Count, and Advance Amount**
    setSelectedPackageId(package_id);
    setPeopleCount(guest_count || 0);
    setAdvanceAmount(parseFloat(advanced_amount) || 0);
    setFinalPrice(parseFloat(final_price) || 0);

    // **Find and Set Package Price**
    const selectedPackage = packageItems.find((pkg) => pkg.id === package_id);
    if (selectedPackage) {
      setPricePerPerson(parseFloat(selectedPackage.price_per_person) || 0);
    } else {
      setPricePerPerson(0);
    }

    // **Ensure State Updates Before Showing Modal**
    setTimeout(() => {
      document.getElementById("modal-update").showModal();
    }, 100);
  };

  const btnUpdate = async () => {
    const id = updateReservationIdRef.current.value;
    const package_id = updateReservationpackageIdRefRef.current.value;
    const checkInDateRaw = updateReservationCheckInDateRef.current.value;
    const checkOutDateRaw = updateReservationCheckOutDateRef.current.value;
    const guestCount = updateReservationPeopleCountRef.current.value;
    const status = updateReservationStatusRef.current.value;
    const note = updateReservationNotesRef.current.value || null;
    const advancedAmount = updateReservationAdvanceAmtRef.current.value || null;
    const paymentStatus = updateReservationPaymentStatusRef.current.value;
    const customerId = state.customerID || null;
    const finalPrice = updateReservationFinalPriceRef.current.value;
    const paymentType = "manual";

    if (!id) {
      toast.error("Invalid request!");
      return;
    }
    if (!package_id) {
      toast.error("Please select a package!");
      return;
    }
    if (!checkInDateRaw) {
      toast.error("Please select check-in date & time!");
      return;
    }
    if (!checkOutDateRaw) {
      toast.error("Please select check-out date & time!");
      return;
    }
    if (!guestCount) {
      toast.error("Please enter the guest count!");
      return;
    }
    if (!status) {
      toast.error("Please select a status!");
      return;
    }
    if (!customerId) {
      toast.error("Invalid customer information!");
      return;
    }
    if (!paymentStatus) {
      toast.error("Please select a payment status!");
      return;
    }
    if (!finalPrice) {
      toast.error("Please enter the final price!");
      return;
    }

    const formatDateTime = (date) =>
      moment(new Date(date)).format("YYYY-MM-DD HH:mm:ss");
    const checkInTime = formatDateTime(checkInDateRaw);
    const checkOutTime = formatDateTime(checkOutDateRaw);

    try {
      const res = await updateDayOutReservation(
        id,
        package_id,
        checkInTime,
        checkOutTime,
        guestCount,
        status,
        note,
        advancedAmount,
        customerId,
        finalPrice,
        paymentType,
        paymentStatus
      );

      if (res.status === 200) {
        updateReservationIdRef.current.value = null;
        updateReservationCheckInDateRef.current.value = null;
        updateReservationCheckOutDateRef.current.value = null;
        updateReservationFinalPriceRef.current.value = null;
        updateReservationpackageIdRefRef.current.value = null;
        updateReservationPeopleCountRef.current.value = null;
        updateReservationStatusRef.current.value = null;
        updateReservationAdvanceAmtRef.current.value = null;
        updateReservationPaymentStatusRef.current.value = null;
        updateReservationNotesRef.current.value = null;

        toast.success("Reservation updated successfully");
        setSelectedPackageId("");
        setPricePerPerson(0);
        setAdvanceAmount(0);
        setFinalPrice(0);
        setSubTotal(0);
        setPeopleCount(0);
        clearSelectedCustomer();
        mutate(APIURL);
        document.getElementById("modal-update").close();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong!");
    }
  };
  const ExcelExport = () => {
    // Log the input to debug issues
    console.log("Exporting Data......... ", reservations);

    const csvData = reservations?.map((reservation) => ({
      "Reservation ID": reservation.id || "N/A",
      "Room Number": reservation.room_no || "N/A",
      "Check-in Date":
        new Date(reservation.check_in_date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }) || "N/A",
      "Check-out Date":
        new Date(reservation.check_out_date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }) || "N/A",
      "Guest Count": reservation.guest_count || "N/A",
      Status: reservation.status || "N/A",
      Notes: reservation.note || "N/A",
      "Advanced Amount": reservation.advanced_amount || "N/A",
      "Final Price": reservation.final_price || "N/A",
      "Customer Name": reservation.customer_name || "N/A",
      "Customer Email": reservation.customer_email || "N/A",
      "Customer Phone": reservation.customer_phone || "N/A",
      "Customer ID": reservation.customer_id || "N/A",
      "Created At":
        new Date(reservation.create_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }) || "N/A",
      "Updated At": reservation.update_at
        ? new Date(reservation.update_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "N/A",
    }));

    // Convert data to CSV format
    const csv = Papa.unparse(csvData, {
      delimiter: ",",
      skipEmptyLines: true,
    });

    // Create and download the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reservations.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // dateFormated fucntions

  const formatDate = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("EN", { dateStyle: "medium" });
  };

  const formatTime = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString("EN", { timeStyle: "short" });
  };

  const formatISODate = (date) => {
    const dateObj = new Date(date);
    return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dateObj
      .getDate()
      .toString()
      .padStart(2, "0")}T${dateObj
      .getHours()
      .toString()
      .padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
  };

  const btnClose = () => {
    console.log("btn colose");
    setState({
      ...state,
      customer: null,
    });
    setSelectedPackageId("");
    setPricePerPerson(0);
    setAdvanceAmount(0);
    setFinalPrice(0);
    setSubTotal(0);
    setPeopleCount(0);
    packageIdRef.current.value = null;
    checkInDateRef.current.value = null;
    checkOutDateRef.current.value = null;
    finalPriceRef.current.value = null;
    advanceAmtRef.current.value = null;
    reservationNotesRef.current.value = null;
    reservationPaymentStatusRef.current.value = null;
    reservationStatusRef.current.value = null;
    reservationPeopleCountRef.current.value = null;
    updateReservationIdRef.current.value = null;
    updateReservationCheckInDateRef.current.value = null;
    updateReservationCheckOutDateRef.current.value = null;
    updateReservationFinalPriceRef.current.value = null;
    updateReservationpackageIdRefRef.current.value = null;
    updateReservationPeopleCountRef.current.value = null;
    updateReservationStatusRef.current.value = null;
    updateReservationAdvanceAmtRef.current.value = null;
    updateReservationPaymentStatusRef.current.value = null;
    updateReservationNotesRef.current.value = null;
  };

  return (
    <Page>
      <div className="flex flex-wrap gap-4 flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex gap-6">
          <h3 className="text-2xl">Day Out Reservations</h3>
          {isManageAllowed && (
            <button
              onClick={() => {
                document.getElementById("modal-add").showModal();
              }}
              className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
            >
              <IconPlus size={22} stroke={iconStroke} /> New
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center">
            <input
              ref={searchRef}
              defaultValue={state.search}
              type="text"
              placeholder="Search by Phone No"
              className="bg-transparent placeholder:text-gray-400 outline-none block"
            />
            {state.search && (
              <button onClick={btnClearSearch} className="text-gray-400">
                <IconX stroke={iconStroke} size={18} />
              </button>
            )}
          </div>
          <button
            onClick={btnSearch}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            Search
          </button>

          <button
            onClick={ExcelExport}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            Export CSV
          </button>

          <button
            onClick={() => document.getElementById("filter-dialog").showModal()}
            className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition"
          >
            <IconFilter />
          </button>
        </div>
      </div>

      {/* search result */}
      {state.searchResults?.length > 0 && (
        <div className="mt-6">
          <h3>Showing Search Result for "{state.search}"</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {state.searchResults.map((reservation, index) => {
              const {
                id,
                package_id,
                customer_id,
                customer_name,
                customer_email,
                customer_phone,
                check_in_time,
                check_out_time,
                final_price,
                status,
                note,
                guest_count,
                advanced_amount,
                unique_code,
                create_at,
                updated_at,
                payment_status,
              } = reservation;

              // Format dates and times
              const dateLocal1 = formatDate(check_in_time);
              const timeLocal1 = formatTime(check_in_time);
              const dateLocal2 = formatDate(check_out_time);
              const timeLocal2 = formatTime(check_out_time);
              const dateFormatted1 = formatISODate(check_in_time);
              const dateFormatted2 = formatISODate(check_out_time);
              const createdAt = new Date(create_at).toLocaleString("EN", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <DayOutReservationCard
                  btnDelete={() => {
                    btnDelete(id);
                  }}
                  btnUpdate={() => {
                    btnShowUpdate(
                      id,
                      package_id,
                      customer_id,
                      customer_name,
                      customer_email,
                      customer_phone,
                      dateFormatted1,
                      dateFormatted2,
                      final_price,
                      guest_count,
                      status,
                      advanced_amount,
                      note,
                      payment_status
                    );
                  }}
                  createdAt={createdAt}
                  package_id={package_id}
                  customer_id={customer_id}
                  customer_name={customer_name}
                  customer_phone={customer_phone}
                  dateLocal1={dateLocal1}
                  dateLocal2={dateLocal2}
                  notes={note}
                  people_count={guest_count}
                  status={status}
                  timeLocal1={timeLocal1}
                  timeLocal2={timeLocal2}
                  unique_code={unique_code}
                  key={unique_code}
                />
              );
            })}
          </div>
        </div>
      )}
      {/* search result */}

      {/* data */}
      <h3 className="mt-6 mb-4 text-base">
        Showing Day Out Reservations for{" "}
        {filters.find((f) => f.key == state.filter).value}
      </h3>
      {reservations.length == 0 ? (
        <div className="text-center w-full h-[50vh] flex flex-col items-center justify-center text-gray-500">
          <img
            src="/assets/illustrations/no-reservation.svg"
            alt="no reservation"
            className="w-full md:w-60"
          />
          <p>No Results found! Change the Filter!</p>
        </div>
      ) : (
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {reservations?.map((reservation) => {
            const {
              id,

              customer_id,
              customer_name,
              customer_email,
              customer_phone,
              check_in_time,
              check_out_time,
              final_price,
              status,
              note,
              guest_count,
              advanced_amount,
              unique_code,
              create_at,
              updated_at,
              package_id,
              payment_status,
            } = reservation;

            // Format dates and times
            const dateLocal1 = formatDate(check_in_time);
            const timeLocal1 = formatTime(check_in_time);
            const dateLocal2 = formatDate(check_out_time);
            const timeLocal2 = formatTime(check_out_time);
            const dateFormatted1 = formatISODate(check_in_time);
            const dateFormatted2 = formatISODate(check_out_time);
            const createdAt = new Date(create_at).toLocaleString("EN", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            // Return RoomReservationCard
            return (
              <DayOutReservationCard
                btnDelete={() => btnDelete(id)}
                btnUpdate={() =>
                  btnShowUpdate(
                    id,
                    customer_id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    dateFormatted1,
                    dateFormatted2,
                    final_price,
                    guest_count,
                    status,
                    advanced_amount,
                    note,
                    package_id,
                    payment_status
                  )
                }
                createdAt={createdAt}
                package_id={package_id}
                customer_id={customer_id}
                customer_name={customer_name}
                customer_phone={customer_phone}
                dateLocal1={dateLocal1}
                dateLocal2={dateLocal2}
                notes={note}
                people_count={guest_count}
                status={status}
                timeLocal1={timeLocal1}
                timeLocal2={timeLocal2}
                unique_code={unique_code}
                key={unique_code}
              />
            );
          })}
        </div>
      )}
      {/* data */}

      {/* filter dialog */}
      <dialog id="filter-dialog" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center">
            <IconFilter stroke={iconStroke} /> Filter
          </h3>
          {/* filters */}
          <div className="my-4">
            <div>
              <label className=" block text-gray-500 text-sm">Filter</label>
              <select
                className="select select-sm select-bordered w-full"
                ref={filterTypeRef}
              >
                {filters?.map((filter, index) => (
                  <option key={index} value={filter.key}>
                    {filter.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <div className="flex-1">
                <label
                  htmlFor="fromDate"
                  className=" block text-gray-500 text-sm"
                >
                  From
                </label>
                <input
                  defaultValue={defaultDateFrom}
                  type="date"
                  ref={fromDateRef}
                  className="text-sm w-full border rounded-lg px-4 py-1 bg-gray-50 outline-restro-border-green-light"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="toDate"
                  className=" block text-gray-500 text-sm"
                >
                  To
                </label>
                <input
                  defaultValue={defaultDateTo}
                  type="date"
                  ref={toDateRef}
                  className="text-sm w-full border rounded-lg px-4 py-1 bg-gray-50 outline-restro-border-green-light"
                />
              </div>
            </div>
          </div>
          {/* filters */}
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
              <button
                onClick={() => {
                  setState({
                    ...state,
                    filter: filterTypeRef.current.value,
                    fromDate: fromDateRef.current.value || null,
                    toDate: toDateRef.current.value || null,
                  });
                }}
                className="btn ml-2"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <DialogAddCustomer
        defaultValue={state.addCustomerDefaultValue}
        branchId={state.addReservationSelectedBranch}
        role={role}
        onSuccess={(phone, name) => {
          setCustomer({ value: phone, label: `${name} - (${phone})` });
        }}
      />
      <dialog id="modal-add" className="modal modal-middle ">
        <div className="max-w-2xl rounded-lg modal-box">
          <h3 className="font-bold text-lg">Add Day Out Reservation</h3>
          <div className="mt-4">
            <label
              htmlFor="customer"
              className="mb-1 block text-gray-500 text-sm"
            >
              Select Customer{" "}
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            {/* <div className="text-sm w-full border rounded-lg bg-gray-50 flex">
              <input
                type="search"
                name="customer"
                className="flex-1 block py-2 px-4 bg-transparent outline-none"
                placeholder="Search Customer by Phone"
                ref={customerSearchRef}
              />
              <button
                onClick={btnSearchCustomer}
                className="text-gray-500 hover:bg-gray-300 active:scale-95 transition rounded-lg bg-gray-200 w-9 h-9 flex items-center justify-center"
              >
                <IconSearch size={18} stroke={iconStroke} />
              </button>
            </div> */}

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

          <div className="flex gap-4 w-full my-4">
            {/* Package Dropdown */}
            <div className="flex-1">
              <label
                htmlFor="package"
                className="mb-1 block text-gray-500 text-sm"
              >
                Package
              </label>
              <select
                ref={packageIdRef}
                name="package"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                value={selectedPackageId}
                onChange={handlePackageChange}
                disabled={isPackageLoading}
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
                className="mb-1 block text-gray-500 text-sm"
              >
                Price Rs.
              </label>
              <input
                value={pricePerPerson}
                type="number"
                name="price"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                disabled
              />
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex-1">
              <label
                htmlFor="checkIndate"
                className="mb-1 block text-gray-500 text-sm"
              >
                Check In Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={checkInDateRef}
                type="datetime-local"
                name="date"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Check In Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="checkOutdate"
                className="mb-1 block text-gray-500 text-sm"
              >
                Check Out Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={checkOutDateRef}
                type="datetime-local"
                name="date"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>
          </div>

          <div className="flex gap-4 w-full mt-4">
            {/* People Count */}
            <div className="flex-1">
              <label
                htmlFor="people"
                className="mb-1 block text-gray-500 text-sm"
              >
                People Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={reservationPeopleCountRef}
                type="number"
                onChange={handlePeopleCountChange}
                min={0}
                name="people"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter People Count"
              />
            </div>

            {/* Status */}
            <div className="flex-1">
              <label
                htmlFor="status"
                className="mb-1 block text-gray-500 text-sm"
              >
                Status
              </label>
              <select
                ref={reservationStatusRef}
                name="status"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
              >
                <option value="booked">Booked</option>
                {/* <option value="confirm">Confirm</option> */}
                <option value="advanced">Advanced</option>
                <option value="cancelled">Cancelled</option>
                <option value="check-in">Check In</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 w-full mt-4"></div>

          <div className="flex gap-4 w-full mt-4">
            <div className="flex-1">
              <label
                htmlFor="finalPrice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Total Amount Rs.{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={finalPriceRef}
                value={finalPrice}
                min={0}
                type="number"
                name="finalPrice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Final Price"
                disabled
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="advanceAmt"
                className="mb-1 block text-gray-500 text-sm"
              >
                Advance Amount{" "}
              </label>
              <input
                ref={advanceAmtRef}
                min={0}
                type="number"
                onChange={handleAdvanceAmountChange}
                name="advanceAmt"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Advance Payment"
              />
            </div>
          </div>

          <div className="flex gap-4 w-full mt-4">
            <div className="flex-1">
              <label
                htmlFor="finalPrice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Sub Total Rs.{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={subTotalRef}
                value={subTotal}
                min={0}
                type="number"
                name="finalPrice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Final Price"
                disabled
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="status"
                className="mb-1 block text-gray-500 text-sm"
              >
                Payment Status
              </label>
              <select
                ref={reservationPaymentStatusRef}
                name="status"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
              >
                <option value="complete">Complete</option>
                <option value="pending">Pending</option>
                {/* <option value="advanced">Advanced</option> */}
                <option value="cancelled">Cancelled</option>
                {/* <option value="check-in">Check In</option> */}
              </select>
            </div>
          </div>

          <div className="my-4">
            <label htmlFor="notes" className="mb-1 block text-gray-500 text-sm">
              Notes
            </label>
            <textarea
              ref={reservationNotesRef}
              name="notes"
              placeholder="Enter Notes Here..."
              className="w-full block h-24 text-sm border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  setCustomer();
                  btnClose();
                }}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnAdd();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* add dialog */}

      {/* update dialog */}

      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Update Reservation</h3>
          <input type="hidden" ref={updateReservationIdRef} />

          <div className="mt-4">
            {state.customerID && (
              <CustomerCard
                phone={state.customerPhone}
                name={state.customerName}
                email={state.customerEmail}
              />
            )}
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="package"
                className="mb-1 block text-gray-500 text-sm"
              >
                Package
              </label>
              <select
                ref={updateReservationpackageIdRefRef}
                name="package"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                onChange={handlePackageChange}
                disabled={isPackageLoading}
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
                className="mb-1 block text-gray-500 text-sm"
              >
                Price Rs.{" "}
              </label>
              <input
                value={pricePerPerson}
                type="number"
                name="price"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                disabled
              />
            </div>
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="checkIndate"
                className="mb-1 block text-gray-500 text-sm"
              >
                Check In Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationCheckInDateRef}
                type="datetime-local"
                name="date"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Check In Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="checkOutdate"
                className="mb-1 block text-gray-500 text-sm"
              >
                Check Out Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationCheckOutDateRef}
                type="datetime-local"
                name="date"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>
          </div>

          <div className="flex gap-4 w-full mt-4">
            <div className="flex-1">
              <label
                htmlFor="people"
                className="mb-1 block text-gray-500 text-sm"
              >
                People Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationPeopleCountRef}
                min={0}
                type="number"
                onChange={handleUpdatePeopleCountChange}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="status"
                className="mb-1 block text-gray-500 text-sm"
              >
                Status
              </label>
              <select
                ref={updateReservationStatusRef}
                name="status"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              >
                <option value="booked">Booked</option>
                {/* <option value="paid">Paid</option> */}
                <option value="advanced">Advanced</option>
                <option value="canceled">Canceled</option>
                <option value="check-in">Check In</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 w-full mt-4">
            <div className="flex-1">
              <label
                htmlFor="advanceAmt"
                className="mb-1 block text-gray-500 text-sm"
              >
                Advance Amount{" "}
              </label>
              <input
                ref={updateReservationAdvanceAmtRef}
                min={0}
                type="number"
                onChange={handleUpdateAdvanceAmountChange}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="finalPrice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Final Price Rs.{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationFinalPriceRef}
                min={0}
                type="number"
                disabled
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
          </div>
          <div className="flex-1 mt-4">
            <label
              htmlFor="paymentStatus"
              className="mb-1 block text-gray-500 text-sm"
            >
              Payment Status
            </label>
            <select
              ref={updateReservationPaymentStatusRef}
              name="paymentStatus"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <div className="my-4">
            <label htmlFor="notes" className="mb-1 block text-gray-500 text-sm">
              Notes
            </label>
            <textarea
              ref={updateReservationNotesRef}
              name="notes"
              placeholder="Enter Notes Here..."
              className="w-full block h-24 text-sm border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  btnClose();
                }}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdate();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* update dialog */}
    </Page>
  );
}
