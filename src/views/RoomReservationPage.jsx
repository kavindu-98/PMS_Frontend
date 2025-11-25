/** @format */

import React, { useRef, useState, Fragment, useEffect } from "react";
import Page from "../components/Page";
import { IconFilter, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { iconStroke } from "../config/config";
import { toast } from "react-hot-toast";
import { mutate } from "swr";
import moment from "moment";
import ReservationGrid from "../components/reservationGrid";
import { searchCustomer } from "../controllers/customers.controller";
import CustomerCard from "../components/CustomerCard";
import {
  addRoomReservation,
  deleteRoomReservation,
  searchRoomReservations,
  updateRoomReservation,
  useRoomReservations,
} from "../controllers/reservations.controller";
import { useRooms } from "../controllers/settings.controller";
import RoomReservationCard from "../components/RoomReservationCard";
import { SCOPES } from "../config/scopes";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
import AsyncCreatableSelect from "react-select/async-creatable";
import DialogAddCustomer from "../components/DialogAddCustomer";
import Papa from "papaparse";

export default function RoomReservationPage() {
  const { role, scope } = getUserDetailsInLocalStorage();
  const userScopes = scope?.split(",");
  let isManageAllowed = false;
  if (role == "admin") {
    isManageAllowed = true;
  } else {
    if (
      userScopes.includes(SCOPES.MANAGE_RESERVATIONS) ||
      userScopes.includes(SCOPES.RESERVATIONS)
    ) {
      isManageAllowed = true;
    }
  }

  const room_type = [
    { key: "SINGLE_ROOM", value: "SINGLE ROOM" },
    { key: "STANDARD_DOUBLE_ROOM", value: "STANDARD DOUBLE_ROOM" },
    { key: "STANDARD_TWIN_ROOM", value: "STANDARD TWIN ROOM" },
    { key: "DELUXE_DOUBLE_ROOM", value: "DELUXE DOUBLE ROOM" },
    { key: "STUDIO_ROOM_OR_APARTMENT", value: "STUDIO ROOM OR APARTMENT" },
    { key: "JUNIOR_SUITE", value: "JUNIOR SUITE" },
    { key: "EXECUTIVE_SUITE", value: "EXECUTIVE SUITE" },
    { key: "PRESIDENTIAL_SUITE", value: "PRESIDENTIAL SUITE" },
  ];

  const Booking_category = [
    { key: "full_board", value: "FULL BOARD" },
    { key: "half_board", value: "HALF BOARD" },
    { key: "bb", value: "BB" },
    { key: "room_only", value: "ROOM ONLY" },
  ];

  const filters = [
    { key: "today", value: "Today" },
    { key: "tomorrow", value: "Tomorrow" },
    { key: "yesterday", value: "Yesterday" },
    { key: "last_7days", value: "Last 7 Days" },
    { key: "this_month", value: "This Month" },
    { key: "last_month", value: "Last Month" },
    { key: "custom", value: "Custom" },
  ];

  // Function to update People Count
  const updatePeopleCount = () => {
    const adultCount =
      parseInt(reservationAdultCountRef.current.value, 10) || 0;
    const childCount =
      parseInt(reservationChildCountRef.current.value, 10) || 0;
    reservationPeopleCountRef.current.value = adultCount + childCount;
  };

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
  // const checkInDateRef = useRef();
  // const checkOutDateRef = useRef();

  const [checkInDate, setcheckInDate] = useState("");
  const [checkOutDate, setcheckOutDate] = useState("");
  const adanceAmtRef = useRef();
  const finalPriceRef = useRef();
  const reservationAdultCountRef = useRef();
  const reservationChildCountRef = useRef();
  const reservationPeopleCountRef = useRef();
  const reservationStatusRef = useRef();
  const reservationNotesRef = useRef();

  const updateReservationIdRef = useRef();

  // const updateReservationCheckInDateRef = useRef();
  // const updateReservationCheckOutDateRef = useRef();

  const [updateReservationCheckInDate, setUpdateReservationCheckInDate] =
    useState("");
  const [updateReservationCheckOutDate, setUpdateReservationCheckOutDate] =
    useState("");

  const updateReservationFinalPriceRef = useRef();
  const updateReservationAdultCountRef = useRef();
  const updateReservationChildCountRef = useRef();
  const updateReservationPeopleCountRef = useRef();
  const updateReservationStatusRef = useRef();
  const updateReservationAdvanceAmtRef = useRef();
  const updateReservationNotesRef = useRef();

  const [roomId, setRoomId] = useState("");
  const [roomType, setRoomType] = useState("");
  const [bookingType2, setBookingType] = useState("");
  const [price, setPrice] = useState("");
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const handleNightsChange = (e) => {
    const numberOfNights = parseInt(e.target.value, 10) || 0;
    setNights(numberOfNights);
    setTotalPrice(numberOfNights * price); // Calculate total price
  };

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const inDate = moment(checkInDate);
      const outDate = moment(checkOutDate);
      let nightsCount = outDate.diff(inDate, "days"); // Difference in days
      // If same date, consider it as one night stay
      if (nightsCount === 0) {
        nightsCount = 1;
      }
      setNights(nightsCount);
      setTotalPrice(nightsCount * price); // Update total price based on nights
    }
  }, [price, checkInDate, checkOutDate]);

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

  const {
    data: RoomsData,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useRooms();

  console.log("roooms data", RoomsData);

  const {
    APIURL,
    data: reservations,
    error,
    isLoading,
  } = useRoomReservations({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
  });

  if (isLoadingRooms) {
    return <Page>Please wait...</Page>;
  }
  if (errorRooms) {
    return <Page>Error loading details! Please try later!</Page>;
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
      const res = await searchRoomReservations(new String(searchQuery).trim());
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

  const handleRoomDetails = (e) => {
    const selectedRoomId = e.target.value;
    setRoomId(selectedRoomId);
    const selectedRoom = RoomsData.find(
      (room) => room.room_no === selectedRoomId
    );
    setRoomType(selectedRoom ? selectedRoom.room_category : "");

    // Reset price when room changes
    setPrice("");
  };

  const handleCheckInDateChange = (e) => {
    const selectedCheckInDate = e.target.value;
    setcheckInDate(selectedCheckInDate);
  };
  const handleCheckOutDateChange = (e) => {
    const selectedCheckOutDate = e.target.value;
    setcheckOutDate(selectedCheckOutDate);
  };

  const handleUpdateCheckInDateChange = (e) => {
    const selectedUpdateCheckInDate = e.target.value;
    setUpdateReservationCheckInDate(selectedUpdateCheckInDate);
  };
  const handleUpdateCheckOutDateChange = (e) => {
    const selectedUpdateCheckOutDate = e.target.value;
    setUpdateReservationCheckOutDate(selectedUpdateCheckOutDate);
  };

  const handleBookingTypeChange = (e) => {
    const selectedBookingType = e.target.value;
    setBookingType(selectedBookingType);

    // Update price based on selected room and booking type
    if (roomId && selectedBookingType) {
      const selectedRoom = RoomsData.find((room) => room.room_no === roomId);
      if (selectedRoom && selectedRoom[selectedBookingType]) {
        setPrice(selectedRoom[selectedBookingType]);
      } else {
        setPrice("");
      }
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
    setcheckInDate("");
    setcheckOutDate("");
    reservationAdultCountRef.current.value = null;
    reservationChildCountRef.current.value = null;
    reservationPeopleCountRef.current.value = null;
    setPrice("");
    setNights("");
  };

  const btnAdd = async () => {
    const bookingTypeMap = {
      full_board: "full-board",
      half_board: "half-board",
      bb: "bb",
      room_only: "room-only",
    };

    const customerId = state.customer?.phone || null;
    const roomNo = roomId;
    const bookingType = bookingTypeMap[bookingType2] || bookingType2;
    const finalPrice = finalPriceRef.current.value || null;
    const adult_count = reservationAdultCountRef.current.value || null; // Use .current.value and default to 0
    const child_count = reservationChildCountRef.current.value || null; // Use .current.value and default to 0
    const guestCount = reservationPeopleCountRef.current.value || null;
    const advancedAmount = adanceAmtRef.current.value || null;
    const status = reservationStatusRef.current.value || null;
    const note = reservationNotesRef.current.value || null;

    if (!customerId) {
      toast.error("Please select customer!");
      return;
    }

    if (!roomNo) {
      toast.error("Please select room!");
      return;
    }

    if (!bookingType) {
      toast.error("Please select booking Type!");
      return;
    }

    if (!checkInDate) {
      toast.error("Please select check-in date & time!");
      return;
    }

    if (!checkOutDate) {
      toast.error("Please select check-out date & time!");
      return;
    }

    if (!adult_count) {
      toast.error("Please enter adult count!");
      return;
    }
    if (!child_count) {
      toast.error("Please enter child count!");
      return;
    }

    if (!finalPrice) {
      toast.error("Please enter final Price!");
      return;
    }

    // Format dates to "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
      const dateObj = new Date(date);
      return moment(dateObj).format("YYYY-MM-DD HH:mm:ss");
    };

    const checkInDate1 = formatDateTime(checkInDate);
    const checkOutDate1 = formatDateTime(checkOutDate);

    try {
      const res = await addRoomReservation(
        roomNo,
        checkInDate1,
        checkOutDate1,
        guestCount,
        status,
        note,
        advancedAmount,
        customerId,
        finalPrice,
        bookingType,
        adult_count, // Pass adult_count
        child_count // Pass child_count
      );
      if (res.status === 200) {
        toast.success(res.data.message);
        // Clear form fields
        setcheckInDate("");
        setcheckOutDate("");
        adanceAmtRef.current.value = null;
        finalPriceRef.current.value = null;
        reservationAdultCountRef.current.value = null;
        reservationChildCountRef.current.value = null;
        reservationPeopleCountRef.current.value = null;
        reservationStatusRef.current.value = null;
        reservationNotesRef.current.value = null;
        setBookingType("");
        setRoomId("");
        setPrice("");
        setRoomType("");
        clearSelectedCustomer();
        await mutate(APIURL);
        clearSelectedCustomer();
        toast.dismiss();
        toast.success(res.data.message);
        console.log("res message", res.data.message);
        console.log("data");
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
      const res = await deleteRoomReservation(id);

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
    room_no,
    room_category,
    booking_type,
    final_price,
    guest_count,
    status,
    advanced_amount,
    note,
    adult_count,
    child_count
  ) => {
    console.log(
      "adult_count:",
      adult_count,
      "child_count:",
      child_count,
      "guest_count",
      guest_count,
      "customer id",
      customer_id,
      "customer name",
      customer_name,
      "customer_email",
      customer_email,
      "final price ",
      final_price
    ); // Debugging
    updateReservationIdRef.current.value = id;

    setState({
      ...state,
      customerID: customer_id,
      customerName: customer_name,
      customerPhone: customer_phone,
      customerEmail: customer_email,
    });

    setUpdateReservationCheckInDate(dateFormatted1);
    setUpdateReservationCheckOutDate(dateFormatted2);

    setRoomId(room_no);
    setRoomType(room_category);

    const bookingTypeMap = {
      full_board: "full-board",
      half_board: "half-board",
      bb: "bb",
      room_only: "room-only",
    };

    // Reverse the map for easier lookup
    const reverseBookingTypeMap = Object.fromEntries(
      Object.entries(bookingTypeMap)?.map(([key, value]) => [value, key])
    );

    const mapBookingType = (bookingType) => {
      return (
        bookingTypeMap[bookingType] ||
        reverseBookingTypeMap[bookingType] ||
        bookingType
      );
    };

    const mappedBookingType = mapBookingType(booking_type);
    setBookingType(mappedBookingType);

    updateReservationAdultCountRef.current.value = adult_count || 0;
    updateReservationChildCountRef.current.value = child_count || 0;
    updateReservationPeopleCountRef.current.value = guest_count || 0;
    updateReservationFinalPriceRef.current.value = final_price;
    updateReservationStatusRef.current.value = status;
    updateReservationAdvanceAmtRef.current.value = advanced_amount;
    updateReservationNotesRef.current.value = note;

    document.getElementById("modal-update").showModal();
  };

  const btnUpdate = async () => {
    const id = updateReservationIdRef.current.value;
    const checkInDateRaw = updateReservationCheckInDate || null;
    const checkOutDateRaw = updateReservationCheckOutDate || null;
    const adult_count =
      parseInt(updateReservationAdultCountRef.current.value, 10) || 0; // Parse as integer
    const child_count =
      parseInt(updateReservationChildCountRef.current.value, 10) || 0; // Parse as integer
    const guestCount = adult_count + child_count; // Calculate total guest count
    const status = updateReservationStatusRef.current.value || null;
    const note = updateReservationNotesRef.current.value || null;
    const advancedAmount = updateReservationAdvanceAmtRef.current.value || null;
    const customerId = state.customerID || null;
    const roomNo = roomId || null;
    const finalPrice = updateReservationFinalPriceRef.current.value || null;

    const bookingTypeMap = {
      full_board: "full-board",
      half_board: "half-board",
      bb: "bb",
      room_only: "room-only",
    };

    const bookingType = bookingTypeMap[bookingType2] || bookingType2;

    if (!id) {
      toast.error("Invalid request!");
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

    // Format dates to "YYYY-MM-DD HH:MM:SS"
    const formatDateTime = (date) => {
      const dateObj = new Date(date);
      return moment(dateObj).format("YYYY-MM-DD HH:mm:ss");
    };

    const checkInDate = formatDateTime(checkInDateRaw);
    const checkOutDate = formatDateTime(checkOutDateRaw);

    try {
      const res = await updateRoomReservation(
        id,
        roomNo,
        checkInDate,
        checkOutDate,
        guestCount, // Send calculated guest count
        status,
        note,
        advancedAmount,
        customerId,
        finalPrice,
        bookingType,
        adult_count, // Send adult count
        child_count // Send child count
      );

      if (res.status === 200) {
        toast.success("Reservation updated successfully");
        mutate(APIURL);
        document.getElementById("modal-update").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.error(message);
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
      "Booking Type": reservation.booking_type || "N/A",
      "Room Category": reservation.room_category || "N/A",
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

  // const rows = ["A", "B", "C", "D", "E", "F", "G"];
  // const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // // Mock data for booked rooms
  // const bookedRooms = ["F5", "F6"];

  // const [selectedRoom, setSelectedRoom] = useState(null);

  // const handleRoomClick = (room) => {
  //   if (!bookedRooms.includes(room)) {
  //     setSelectedRoom(room);
  //     alert(`You selected room: ${room}`);
  //   }
  // };
  return (
    <Page>
      <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-6">
          <h3 className="text-2xl">Room Reservations</h3>
          {isManageAllowed && (
            <button
              onClick={() => {
                document.getElementById("modal-add").showModal();
              }}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
            >
              <IconPlus size={22} stroke={iconStroke} /> New
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex items-center px-2 py-1 bg-gray-100 rounded-lg">
            <input
              ref={searchRef}
              defaultValue={state.search}
              type="text"
              placeholder="Search By Phone No"
              className="block bg-transparent outline-none placeholder:text-gray-400"
            />
            {state.search && (
              <button onClick={btnClearSearch} className="text-gray-400">
                <IconX stroke={iconStroke} size={18} />
              </button>
            )}
          </div>
          <button
            onClick={btnSearch}
            className="px-4 py-1 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
          >
            Search
          </button>

          <button
            onClick={ExcelExport}
            className="px-4 py-1 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
          >
            Export CSV
          </button>

          <button
            onClick={() => document.getElementById("filter-dialog").showModal()}
            className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
          >
            <IconFilter />
          </button>
        </div>
      </div>
      <div>
        <ReservationGrid
          type={state.filter}
          from={state.fromDate}
          to={state.toDate}
        />
      </div>
      {/* search result */}
      {state.searchResults?.length > 0 && (
        <div className="mt-6">
          <h3>Showing Search Result for "{state.search}"</h3>
          <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {state.searchResults.map((reservation, index) => {
              console.log(reservation.adult_count);
              const {
                id,
                customer_id,
                customer_name,
                customer_email,
                customer_phone,
                check_in_date,
                check_out_date,
                room_no,
                room_category,
                booking_type,
                final_price,
                status,
                note,
                guest_count,
                advanced_amount,
                unique_code,
                create_at,
                updated_at,
                adult_count,
                child_count,
              } = reservation;

              // Format dates and times
              const dateLocal1 = formatDate(check_in_date);
              const timeLocal1 = formatTime(check_in_date);
              const dateLocal2 = formatDate(check_out_date);
              const timeLocal2 = formatTime(check_out_date);
              const dateFormatted1 = formatISODate(check_in_date);
              const dateFormatted2 = formatISODate(check_out_date);
              const createdAt = new Date(create_at).toLocaleString("EN", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <RoomReservationCard
                  btnDelete={() => {
                    btnDelete(id);
                  }}
                  btnUpdate={() => {
                    btnShowUpdate(
                      id,
                      customer_id,
                      customer_name,
                      customer_email,
                      customer_phone,
                      dateFormatted1,
                      dateFormatted2,
                      room_no,
                      room_category,
                      booking_type,
                      final_price,
                      guest_count,
                      status,
                      advanced_amount,
                      note,
                      adult_count,
                      child_count
                    );
                  }}
                  createdAt={createdAt}
                  customer_name={customer_name}
                  customer_id={customer_id}
                  dateLocal1={dateLocal1}
                  dateLocal2={dateLocal2}
                  notes={note}
                  people_count={guest_count}
                  status={status}
                  table_title={room_no}
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
        Showing Room Reservations for{" "}
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
        <div className="grid grid-cols-1 gap-4  md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {reservations?.map((reservation) => {
            const {
              id,
              customer_id,
              customer_name,
              customer_email,
              customer_phone,
              check_in_date,
              check_out_date,
              room_no,
              room_category,
              booking_type,
              final_price,
              status,
              note,
              adult_count,
              child_count,
              guest_count,
              advanced_amount,
              unique_code,
              create_at,
              updated_at,
            } = reservation;

            // Format dates and times
            const dateLocal1 = formatDate(check_in_date);
            const timeLocal1 = formatTime(check_in_date);
            const dateLocal2 = formatDate(check_out_date);
            const timeLocal2 = formatTime(check_out_date);
            const dateFormatted1 = formatISODate(check_in_date);
            const dateFormatted2 = formatISODate(check_out_date);
            const createdAt = new Date(create_at).toLocaleString("EN", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            // Return RoomReservationCard
            return (
              <RoomReservationCard
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
                    room_no,
                    room_category,
                    booking_type,
                    final_price,
                    guest_count,
                    status,
                    advanced_amount,
                    note,
                    adult_count,
                    child_count
                  )
                }
                createdAt={createdAt}
                customer_id={customer_id}
                customer_name={customer_name}
                dateLocal1={dateLocal1}
                dateLocal2={dateLocal2}
                notes={note}
                people_count={guest_count}
                status={status}
                table_title={room_no}
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
          <h3 className="flex items-center text-lg font-bold">
            <IconFilter stroke={iconStroke} /> Filter
          </h3>
          {/* filters */}
          <div className="my-4">
            <div>
              <label className="block text-sm text-gray-500 ">Filter</label>
              <select
                className="w-full select select-sm select-bordered"
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
                  className="block text-sm text-gray-500 "
                >
                  From
                </label>
                <input
                  defaultValue={defaultDateFrom}
                  type="date"
                  ref={fromDateRef}
                  className="w-full px-4 py-1 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="toDate"
                  className="block text-sm text-gray-500 "
                >
                  To
                </label>
                <input
                  defaultValue={defaultDateTo}
                  type="date"
                  ref={toDateRef}
                  className="w-full px-4 py-1 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
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
                className="ml-2 btn"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* filter dialog */}

      {/* add dialog */}
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
          <h3 className="text-lg font-bold ">Add Room Reservation</h3>

          <div className="mt-4">
            <label
              htmlFor="customer"
              className="block mb-1 text-sm text-gray-500"
            >
              Select Customer{" "}
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            {/* <div className="flex w-full text-sm border rounded-lg bg-gray-50">
              <input
                type="search"
                name="customer"
                className="flex-1 block px-4 py-2 bg-transparent outline-none"
                placeholder="Search Customer by Phone"
                ref={customerSearchRef}
              />
              <button
                onClick={btnSearchCustomer}
                className="flex items-center justify-center text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-300 active:scale-95 w-9 h-9"
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

          <div className="flex w-full gap-4">
            <div className="flex-1">
              <label
                htmlFor="checkIndate"
                className="block mb-1 text-sm text-gray-500"
              >
                Check In Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                value={checkInDate}
                onChange={handleCheckInDateChange}
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
                className="block mb-1 text-sm text-gray-500"
              >
                Check Out Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                value={checkOutDate}
                onChange={handleCheckOutDateChange}
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

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="roomNo"
                className="block mb-1 text-sm text-gray-500"
              >
                Room
              </label>
              <select
                value={roomId}
                name="room"
                onChange={handleRoomDetails}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Room"
              >
                <option value="">Select Room</option>
                {RoomsData?.map((room) => (
                  <option key={room.id} value={room.room_no}>
                    {room.room_no} {room.room_category} (Bed Count:{" "}
                    {room.bed_count}) (Max per: {room.max_person}){" "}
                    {room.smoking_facility}
                  </option>
                ))}
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
                value={roomType}
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
                htmlFor="roomType"
                className="block mb-1 text-sm text-gray-500"
              >
                Booking Category
              </label>
              <select
                value={bookingType2}
                name="room"
                onChange={handleBookingTypeChange}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Booking Category"
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
                value={price}
                type="number"
                name="price"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                disabled
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            {/* Adult Count */}
            <div className="flex-1">
              <label
                htmlFor="adult"
                className="block mb-1 text-sm text-gray-500"
              >
                Adult Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={reservationAdultCountRef}
                min={0}
                type="number"
                name="adult"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Adult Count"
                onChange={updatePeopleCount} // Update People Count when Adult Count changes
              />
            </div>

            {/* Child Count */}
            <div className="flex-1">
              <label
                htmlFor="child"
                className="block mb-1 text-sm text-gray-500"
              >
                Child Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={reservationChildCountRef}
                min={0}
                type="number"
                name="child"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Child Count"
                onChange={updatePeopleCount} // Update People Count when Child Count changes
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            {/* People Count */}
            <div className="flex-1">
              <label
                htmlFor="people"
                className="block mb-1 text-sm text-gray-500"
              >
                People Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={reservationPeopleCountRef}
                min={0}
                type="number"
                name="people"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter People Count"
                readOnly // Make it read-only since it's auto-filled
              />
            </div>

            {/* Status */}
            <div className="flex-1">
              <label
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Status
              </label>
              <select
                ref={reservationStatusRef}
                name="status"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
              >
                <option value="booked">Booked</option>
                <option value="paid">Paid</option>
                <option value="advanced">Advanced</option>
                <option value="cancelled">Cancelled</option>
                <option value="check-in">Check In</option>
              </select>
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
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
                value={nights}
                readOnly // Make it read-only since it's auto-calculated
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="totalPrice"
                className="block mb-1 text-sm text-gray-500"
              >
                Total Price{" "}
              </label>
              <input
                min={0}
                type="number"
                name="totalPrice"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total Price"
                value={totalPrice} // Display calculated total price
                readOnly
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="advanceAmt"
                className="block mb-1 text-sm text-gray-500"
              >
                Advance Amount{" "}
              </label>
              <input
                ref={adanceAmtRef}
                min={0}
                type="number"
                name="advanceAmt"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Advance Payment"
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
                ref={finalPriceRef}
                min={0}
                type="number"
                name="finalPrice"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Final Price"
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
              placeholder="Enter Notes Here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  clearSelectedCustomer();
                }}
                className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnAdd();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
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
          <h3 className="text-lg font-bold">Update Reservation</h3>
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
          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="checkIndate"
                className="block mb-1 text-sm text-gray-500"
              >
                Check In Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                value={updateReservationCheckInDate}
                onChange={handleUpdateCheckInDateChange}
                type="datetime-local"
                name="date"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Check In Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="checkOutdate"
                className="block mb-1 text-sm text-gray-500"
              >
                Check Out Date{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                value={updateReservationCheckOutDate}
                onChange={handleUpdateCheckOutDateChange}
                type="datetime-local"
                name="date"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="roomNo"
                className="block mb-1 text-sm text-gray-500"
              >
                Room
              </label>
              <select
                value={roomId}
                name="room"
                onChange={handleRoomDetails}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Room"
              >
                <option value="">Select Room</option>
                {RoomsData?.map((room) => (
                  <option key={room.id} value={room.room_no}>
                    {room.room_no} {room.room_category} (Bed Count:{" "}
                    {room.bed_count}) (Max per: {room.max_person}){" "}
                    {room.smoking_facility}
                  </option>
                ))}
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
                value={roomType}
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
                htmlFor="roomType"
                className="block mb-1 text-sm text-gray-500"
              >
                Booking Category
              </label>
              <select
                value={bookingType2}
                name="room"
                onChange={handleBookingTypeChange}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Booking Category"
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
                value={price}
                type="number"
                name="price"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                disabled
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="adult_count"
                className="block mb-1 text-sm text-gray-500"
              >
                Adult Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationAdultCountRef}
                min={0}
                type="number"
                name="adult_count"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter People Count"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="child_count"
                className="block mb-1 text-sm text-gray-500"
              >
                Child Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationChildCountRef}
                min={0}
                type="number"
                name="child_count"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter People Count"
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="people"
                className="block mb-1 text-sm text-gray-500"
              >
                People Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={updateReservationPeopleCountRef}
                min={0}
                type="number"
                name="people"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter People Count"
                readOnly
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Status
              </label>
              <select
                ref={updateReservationStatusRef}
                name="status"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
              >
                <option value="booked">Booked</option>
                <option value="paid">Paid</option>
                <option value="advanced">Advanced</option>
                <option value="cancelled">Cancelled</option>
                <option value="check-in">Check In</option>
              </select>
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="nights"
                className="block mb-1 text-sm text-gray-500"
              >
                No Of Nights{" "}
              </label>
              <input
                min={0}
                type="number"
                name="nights"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Number Of Nights"
                value={nights}
                onChange={handleNightsChange} // Handle changes here
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="totalPrice"
                className="block mb-1 text-sm text-gray-500"
              >
                Total Price{" "}
              </label>
              <input
                min={0}
                type="number"
                name="totalPrice"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total Price"
                value={totalPrice} // Display calculated total price
                readOnly
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="advanceAmt"
                className="block mb-1 text-sm text-gray-500"
              >
                Advance Amount{" "}
              </label>
              <input
                ref={updateReservationAdvanceAmtRef}
                min={0}
                type="number"
                name="advanceAmt"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Advance Payment"
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
                ref={updateReservationFinalPriceRef}
                min={0}
                type="number"
                name="finalPrice"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Final Price"
              />
            </div>
          </div>

          <div className="my-4">
            <label htmlFor="notes" className="block mb-1 text-sm text-gray-500">
              Notes
            </label>
            <textarea
              ref={updateReservationNotesRef}
              name="notes"
              placeholder="Enter Notes Here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdate();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
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
