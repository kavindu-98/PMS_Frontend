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
  useHallReservations,
  addHallReservation,
  useHallReservationInit,
  searchHallReservations,
  updateHallReservation,
  deleteHallReservation,
} from "../controllers/hall_reservation.controller";
import {
  useHalls,
  useRooms,
  useWeddingPackages,
} from "../controllers/settings.controller";
import HallReservationCard from "../components/HallReservationCard";
import { SCOPES } from "../config/scopes";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
import AsyncCreatableSelect from "react-select/async-creatable";
import DialogAddCustomer from "../components/DialogAddCustomer";
import Papa from "papaparse";

export default function HallReservationPage() {
  const { role, scope } = getUserDetailsInLocalStorage();
  const userScopes = scope?.split(",");
  let isManageAllowed = false;
  if (role == "admin") {
    isManageAllowed = true;
  } else {
    if (
      userScopes.includes(SCOPES.MANAGE_HALL_RESERVATIONS) ||
      userScopes.includes(SCOPES.HALL_RESERVATIONS)
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

  // Function to update People Count
  // const updatePeopleCount = () => {
  //   const adultCount =
  //     parseInt(reservationAdultCountRef.current.value, 10) || 0;
  //   const childCount =
  //     parseInt(reservationChildCountRef.current.value, 10) || 0;
  //   reservationPeopleCountRef.current.value = adultCount + childCount;
  // };

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
  const adanceAmtRef = useRef();
  const reservationStatusRef = useRef();
  const hallIdRef = useRef();
  const packageRef = useRef();
  const startTimeRef = useRef();
  const endTimeRef = useRef();
  const dateRef = useRef();
  const guestCountRef = useRef();
  const paymentTypeRef = useRef();
  const roomIdRef = useRef();

  const adanceAmtUpdateRef = useRef();
  const reservationStatusUpdateRef = useRef();
  const hallIdUpdateRef = useRef();
  const packageUpdateRef = useRef();
  const startTimeUpdateRef = useRef();
  const endTimeUpdateRef = useRef();
  const dateUpdateRef = useRef();
  const guestCountUpdateRef = useRef();
  const paymentTypeUpdateRef = useRef();
  const roomIdUpdateRef = useRef();
  const discountUpdateRef = useRef();
  const subTotalUpdateRef = useRef();
  const totalUpdateRef = useRef();
  const [selectedHall, setSelectedHall] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const updateReservationIdRef = useRef();

  const updateReservationCheckInDateRef = useRef();
  const updateReservationCheckOutDateRef = useRef();
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

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [guestCount, setGuestCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);

  const handleNightsChange = (e) => {
    const numberOfNights = parseInt(e.target.value, 10) || 0;
    setNights(numberOfNights);
    setTotalPrice(numberOfNights * price); // Calculate total price
  };

  const { data: hallReservations, isLoading: isReservationsLoading } =
    useHallReservations(); // Fetch packages
  const [selectedPackageId, setSelectedPackageId] = useState(""); // Store selected package ID
  //const [price, setPrice] = useState(""); // Store selected package price
  const [pricePerPerson, setPricePerPerson] = useState(""); // Store price per person

  //   // Function to handle package selection
  // const handlePackageChange = (e) => {
  //   const packageId = parseInt(e.target.value, 10);
  //   const selectedPkg = pkgs.find((pkg) => pkg.wedding_package_id === packageId);
  //   setSelectedPackage(selectedPkg);

  //   // Recalculate total price if guest count is already set
  //   if (guestCount > 0 && selectedPkg) {
  //     setTotalPrice(selectedPkg.price_per_person * guestCount);
  //   }
  // };

  // // Function to handle guest count change
  // const handleGuestCountChange = (e) => {
  //   const count = parseInt(e.target.value, 10) || 0; // Default to 0 if invalid input
  //   setGuestCount(count);

  //   // Recalculate total price if a package is already selected
  //   if (selectedPackage) {
  //     setTotalPrice(selectedPackage.price_per_person * count);
  //   }
  // };

  // Handle package change
  const handlePackageChange = (e) => {
    const packageId = parseInt(e.target.value, 10);
    setSelectedPackage(packageId);
    const selectedPkg = pkgs.find(
      (pkg) => pkg.wedding_package_id === packageId
    );
    setSelectedPackage(selectedPkg);

    if (guestCount > 0 && selectedPkg) {
      const total = selectedPkg.price_per_person * guestCount;
      setTotalPrice(total);
      calculateSubTotal(total, discount);
    }
  };

  // Handle guest count change
  const handleGuestCountChange = (e) => {
    const count = parseInt(e.target.value, 10) || 0;
    setGuestCount(count);

    if (selectedPackage) {
      const total = selectedPackage.price_per_person * count;
      setTotalPrice(total);
      calculateSubTotal(total, discount);
    }
  };

  // Handle discount change
  const handleDiscountChange = (e) => {
    const discountValue = parseInt(e.target.value, 10) || 0;
    setDiscount(discountValue);

    calculateSubTotal(totalPrice, discountValue);
  };

  // Calculate subTotal
  const calculateSubTotal = (total, discountValue) => {
    const discountedAmount = (total * discountValue) / 100;
    const subTotalValue = total - discountedAmount;
    setSubTotal(subTotalValue);
  };

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

  // console.log("roooms data", RoomsData);

  const {
    APIURL,
    data: reservations,
    error,
    isLoading,
  } = useHallReservationInit({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
  });

  const {
    APIURL: APIURLHalls,
    halls: halls,
    error: errorHalls,
    isLoading: isLoadingHalls,
  } = useHalls();
  const {
    APIURL: APIURLPackages,
    pkgs: pkgs,
    error: errorPackages,
    isLoading: isLoadingPackages,
  } = useWeddingPackages();

  const {
    data: RoomsData,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useRooms();

  if (isReservationsLoading) {
    return <Page>Please wait...</Page>;
  }
  // if (errorRooms) {
  //   return <Page>Error loading details! Please try later!</Page>;
  // }

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please try later!</Page>;
  }

  // useEffect(() => {

  //     if (halls.length ) {
  //       const matchingHall = halls.find((hall) => hall.name === hall_name);
  //       if (matchingHall) {
  //         setSelectedHall(matchingHall.id); // Set hall ID instead of name
  //       }
  //     }
  //   }, [halls,  hall_name]);

  const btnSearch = async () => {
    const searchQuery = searchRef.current.value;
    if (!new String(searchQuery).trim()) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await searchHallReservations(new String(searchQuery).trim());
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
    const PackageId = packageRef.current.value;
    const customerId = state.customer?.phone || null;
    const startTimeRaw = startTimeRef.current.value;
    const endTimeRaw = endTimeRef.current.value;
    const hallId = hallIdRef.current.value;
    const dateRaw = dateRef.current.value;
    const guestCount = guestCountRef.current.value || null;
    const advancePayment = adanceAmtRef.current.value || null;
    const status = reservationStatusRef.current.value || null;
    const paymentType = paymentTypeRef.current.value || null;
    const roomNo = roomIdRef.current.value;

    // Validate required fields
    if (!customerId) {
      toast.error("Please select customer!");
      return;
    }
    if (!hallId) {
      toast.error("Please select hall!");
      return;
    }
    if (!PackageId) {
      toast.error("Please select package!");
      return;
    }
    if (!startTimeRaw) {
      toast.error("Please select start time!");
      return;
    }
    if (!endTimeRaw) {
      toast.error("Please select end time!");
      return;
    }
    if (!status) {
      console.error("Status is null or not selected");
      toast.error("Please select a status!");
      return;
    }

    // Parse and format date/time
    const date = dateRaw;
    // Convert "HH:mm" to "HH:mm:ss"
    const formatTime = (time) => {
      if (time && time.includes(":")) {
        return `${time}:00`;
      }
      return time; // Return as is if already in "HH:mm:ss"
    };

    const startTime = formatTime(startTimeRaw);
    const endTime = formatTime(endTimeRaw);

    // Calculate total price
    const selectedPackage = pkgs.find(
      (pkg) => pkg.wedding_package_id === PackageId
    );
    const pricePerPerson = selectedPackage?.price_per_person || 0;
    const total = totalPrice;
    // const subTotal = subTotal; // You can customize this if necessary.
    //  const roomNo = 5;

    // Prepare payload object
    const payload = {
      hallId,
      customerId,
      PackageId,
      date,
      startTime,
      endTime,
      guestCount,
      total,
      discount,
      subTotal,
      status,
      advancePayment,
      paymentType,
      roomNo,
    };

    try {
      const res = await addHallReservation(payload);

      if (res.status === 200) {
        toast.success(res.data.message);
        // Clear form fields
        packageRef.current.value = null;
        startTimeRef.current.value = null;
        endTimeRef.current.value = null;
        hallIdRef.current.value = null;
        dateRef.current.value = null;
        guestCountRef.current.value = null;
        adanceAmtRef.current.value = null;
        reservationStatusRef.current.value = null;
        paymentTypeRef.current.value = null;
        roomIdRef.current.value = null;

        clearSelectedCustomer();
        await mutate(APIURL); // Reload or refetch data
        toast.dismiss();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error("Error:", error);
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
      const res = await deleteHallReservation(id);

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
    package_id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    start_time,
    date,
    hall_id,
    hall_name,
    roomID,
    room_category,
    end_time,
    guest_count,
    room_no,
    total,
    discount,
    sub_total,
    advance_payment,
    payment_type,
    status
  ) => {
    //console.log("adult_count:", adult_count, "child_count:", child_count,"guest_count", guest_count); // Debugging

    // Update totalPrice and subTotal before showing the modal
    setTotalPrice(total);
    setSubTotal(sub_total);

    console.log(
      "id",
      id,
      "cus id",
      customer_id,
      "cus name",
      customer_name,
      "cus email",
      customer_email,
      "cus phone",
      customer_phone,
      "start time",
      start_time,
      "date",
      date,
      "hall id",
      hall_id,
      "hall name",
      hall_name,
      "end time",
      end_time,
      "count",
      guest_count,
      "room no",
      room_no,
      "total",
      total,
      "dis",
      discount,
      "sub",
      sub_total,
      "adv",
      advance_payment,
      "type",
      payment_type,
      "status",
      status
    );
    updateReservationIdRef.current.value = id;

    setState({
      ...state,
      customerID: customer_id,
      customerName: customer_name,
      customerPhone: customer_phone,
      customerEmail: customer_email,
    });

    startTimeUpdateRef.current.value = start_time;
    endTimeUpdateRef.current.value = end_time;
    dateUpdateRef.current.value = date;
    guestCountUpdateRef.current.value = guest_count;
    paymentTypeUpdateRef.current.value = payment_type;
    roomIdUpdateRef.current.value = room_no;
    //packageUpdateRef.current.value = room_no;
    hallIdUpdateRef.current.value = hall_name;
    reservationStatusUpdateRef.current.value = status;
    adanceAmtUpdateRef.current.value = advance_payment;
    discountUpdateRef.current.value = discount;
    subTotalUpdateRef.current.value = sub_total;
    totalUpdateRef.current.value = total;
    setSelectedHall(hall_id);
    setSelectedRoom(room_no);
    setSelectedStatus(status);
    setSelectedPackage(package_id);

    document.getElementById("modal-update").showModal();
  };

  const btnUpdate = async () => {
    const id = updateReservationIdRef.current.value;

    const hallId = hallIdUpdateRef.current.value;
    const customerId = state.customerID || null;
    const PackageId = packageUpdateRef.current.value;
    const date = dateUpdateRef.current.value;
    const startTimeRaw = startTimeUpdateRef.current.value;
    const endTimeRaw = endTimeUpdateRef.current.value;
    const guestCount = guestCountUpdateRef.current.value;
    const total = totalUpdateRef.current.value;
    const discount = discountUpdateRef.current.value;
    const subTotal = subTotalUpdateRef.current.value;
    const status = reservationStatusUpdateRef.current.value;
    const advancePayment = adanceAmtUpdateRef.current.value;
    const paymentType = paymentTypeUpdateRef.current.value;
    const roomNo = roomIdUpdateRef.current.value;
    // const roomNo = 9;

    // Validate required fields
    if (!customerId) {
      toast.error("Please select customer!");
      return;
    }
    if (!hallId) {
      toast.error("Please select hall!");
      return;
    }
    if (!PackageId) {
      toast.error("Please select package!");
      return;
    }
    if (!startTimeRaw) {
      toast.error("Please select start time!");
      return;
    }
    if (!endTimeRaw) {
      toast.error("Please select end time!");
      return;
    }
    if (!status) {
      console.error("Status is null or not selected");
      toast.error("Please select a status!");
      return;
    }

    // // Convert "HH:mm" to "HH:mm:ss"
    // const formatTime = (time) => {
    //   if (time && time.includes(":")) {
    //     return `${time}:00`;
    //   }
    //   return time; // Return as is if already in "HH:mm:ss"
    // };

    // const startTime = formatTime(startTimeRaw);
    // const endTime = formatTime(endTimeRaw);
    const formatTime = (time) => {
      if (time && time.match(/^\d{2}:\d{2}$/)) {
        return `${time}:00`; // Convert "HH:mm" to "HH:mm:ss"
      }
      return time; // Return as is if already "HH:mm:ss" or invalid
    };

    const startTime = formatTime(
      startTimeRaw !== startTimeUpdateRef.current.defaultValue
        ? startTimeRaw
        : startTimeRaw
    );
    const endTime = formatTime(
      endTimeRaw !== endTimeUpdateRef.current.defaultValue
        ? endTimeRaw
        : endTimeRaw
    );

    const payload = {
      hallId,
      customerId,
      PackageId,
      date,
      startTime,
      endTime,
      guestCount,
      total,
      discount,
      subTotal,
      status,
      advancePayment,
      paymentType,
      roomNo,
    };

    try {
      const res = await updateHallReservation(id, payload);

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
      "Hall Number": reservation.hall_id || "N/A",
      "Start Time": reservation.start_time || "N/A",
      "End Time": reservation.end_time || "N/A",
      Date: reservation.date || "N/A",
      "Guest Count": reservation.guest_count || "N/A",
      Status: reservation.status || "N/A",
      "Advanced Amount": reservation.advance_payment || "N/A",
      Discount: reservation.discount || "N/A",
      "Final Price": reservation.sub_total || "N/A",
      "Customer Name": reservation.customer_name || "N/A",
      "Customer Email": reservation.customer_email || "N/A",
      "Customer Phone": reservation.customer_phone || "N/A",
      // "Customer ID": reservation.customer_id || "N/A",
      "Created At": reservation.created_at || "N/A",
      "Updated At": reservation.updated_at || "N/A",
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
    link.download = "Hall_Reservations.csv";
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
          <h3 className="text-2xl">Wedding Hall Reservations</h3>
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
              placeholder="Search Hall Reservation"
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

      {/* search result */}
      {state.searchResults?.length > 0 && (
        <div className="mt-6">
          <h3>Showing Search Result for "{state.search}"</h3>
          <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {state.searchResults.map((reservation, index) => {
              //console.log(reservation.adult_count)
              const {
                id,
                package_id,
                customer_id,
                customer_name,
                customer_email,
                customer_phone,
                start_time,
                date,
                hall_id,
                hall_name,
                room_category,
                end_time,
                guest_count,
                roomID,
                room_no,
                total,
                discount,
                sub_total,
                advance_payment,
                payment_type,
                status,
              } = reservation;

              // Format dates and times
              // const dateLocal1 = formatDate(check_in_date);
              // const timeLocal1 = formatTime(check_in_date);
              // const dateLocal2 = formatDate(check_out_date);
              // const timeLocal2 = formatTime(check_out_date);
              // const dateFormatted1 = formatISODate(check_in_date);
              // const dateFormatted2 = formatISODate(check_out_date);
              // const createdAt = new Date(create_at).toLocaleString("EN", {
              //   dateStyle: "medium",
              //   timeStyle: "short",
              // });

              return (
                <HallReservationCard
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
                      start_time,
                      date,
                      hall_id,
                      hall_name,
                      roomID,
                      room_category,
                      end_time,
                      guest_count,
                      room_no,
                      total,
                      discount,
                      sub_total,
                      advance_payment,
                      payment_type,
                      status
                    );
                  }}
                  // createdAt={createdAt}
                  id={id}
                  customer_name={customer_name}
                  start_time={start_time}
                  date={date}
                  end_time={end_time}
                  guest_count={guest_count}
                  status={status}
                  room_no={room_no}
                  hall_id={hall_id}
                  // timeLocal1={timeLocal1}
                  // timeLocal2={timeLocal2}
                  // unique_code={unique_code}
                  // key={unique_code}
                />
              );
            })}
          </div>
        </div>
      )}
      {/* search result */}

      {/* data */}
      <h3 className="mt-6 mb-4 text-base">
        Showing Hall Reservations for{" "}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {reservations?.map((reservation) => {
            const {
              id,
              package_id,
              customer_id,
              customer_name,
              customer_email,
              customer_phone,
              start_time,
              date,
              hall_id,
              hall_name,
              roomID,
              room_category,
              end_time,
              guest_count,
              room_no,
              total,
              discount,
              sub_total,
              advance_payment,
              payment_type,
              status,
            } = reservation;

            // Format dates and times
            // const dateLocal1 = formatDate(check_in_date);
            // const timeLocal1 = formatTime(check_in_date);
            // const dateLocal2 = formatDate(check_out_date);
            // const timeLocal2 = formatTime(check_out_date);
            // const dateFormatted1 = formatISODate(check_in_date);
            // const dateFormatted2 = formatISODate(check_out_date);
            // const createdAt = new Date(create_at).toLocaleString("EN", {
            //   dateStyle: "medium",
            //   timeStyle: "short",
            // });

            // Return RoomReservationCard
            return (
              <HallReservationCard
                btnDelete={() => btnDelete(id)}
                btnUpdate={() =>
                  btnShowUpdate(
                    id,
                    package_id,
                    customer_id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    start_time,
                    date,
                    hall_id,
                    hall_name,
                    roomID,
                    room_category,
                    end_time,
                    guest_count,
                    room_no,
                    total,
                    discount,
                    sub_total,
                    advance_payment,
                    payment_type,
                    status
                  )
                }
                id={id}
                customer_name={customer_name}
                start_time={start_time}
                date={date}
                end_time={end_time}
                guest_count={guest_count}
                status={status}
                room_no={room_no}
                hall_id={hall_id}
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

          <div className="modal-action">
            <form method="dialog">
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

      <dialog id="modal-add" className="modal modal-middle ">
        <div className="max-w-2xl rounded-lg modal-box">
          <h3 className="text-lg font-bold">Add Hall Reservation</h3>

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
                email={state.customer.email}
                birth_date={state.customer.birth_date}
                gender={state.customer.gender}
                // created_at={state.customer.created_at}
                btnAction={() => {
                  clearSelectedCustomer();
                }}
              />
            )}
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="hall"
                className="block mb-1 text-sm text-gray-500"
              >
                Hall
              </label>
              <select
                ref={hallIdRef}
                name="hall"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Hall"
              >
                <option value="">None</option>
                {halls?.map((hall) => (
                  <option value={hall.id} key={hall.id}>
                    {hall.name} (Max count:{hall.max_count}) (Min count:
                    {hall.min_count})
                  </option>
                ))}
              </select>
            </div>
            {/* Adult Count */}
            <div className="flex-1">
              <label
                htmlFor="package"
                className="block mb-1 text-sm text-gray-500"
              >
                Package
              </label>
              <select
                ref={packageRef}
                name="package"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Package"
                onChange={handlePackageChange}
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

            {/* Child Count */}
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="startTime"
                className="block mb-1 text-sm text-gray-500"
              >
                Start Time{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={startTimeRef}
                type="time"
                name="startTime"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Start Time"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="endTime"
                className="block mb-1 text-sm text-gray-500"
              >
                End Time{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={endTimeRef}
                type="time"
                name="endTime"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Start Time"
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="date"
                className="block mb-1 text-sm text-gray-500"
              >
                Date <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={dateRef}
                type="date"
                name="date"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="guestCount"
                className="block mb-1 text-sm text-gray-500"
              >
                Guest Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={guestCountRef}
                min={0}
                type="number"
                name="guestCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Guest Count"
                onChange={handleGuestCountChange}
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="roomNo"
                className="block mb-1 text-sm text-gray-500"
              >
                Changing Room
              </label>
              <select
                ref={roomIdRef}
                name="room"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Room"
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
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Status
              </label>
              <select
                name="status"
                ref={reservationStatusRef}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
              >
                <option value="">Select Status</option>
                <option value="booked">Booked</option>
                <option value="paid">Paid</option>
                <option value="advanced">Advanced</option>
                <option value="cancelled">Cancelled</option>
                <option value="check-in">Check-in</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="discount"
                className="block mb-1 text-sm text-gray-500"
              >
                Discount (%)
              </label>
              <input
                min={0}
                type="number"
                name="discount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total Price"
                onChange={handleDiscountChange}
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="total"
                className="block mb-1 text-sm text-gray-500"
              >
                Total{" "}
              </label>
              <input
                min={0}
                type="number"
                name="total"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total"
                value={totalPrice}
                readOnly
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="subTotal"
                className="block mb-1 text-sm text-gray-500"
              >
                Sub Total{" "}
              </label>
              <input
                min={0}
                type="number"
                name="subTotal"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total Price"
                value={subTotal}
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
                Advance Payment{" "}
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
                htmlFor="paymentType"
                className="block mb-1 text-sm text-gray-500"
              >
                Payment Type
              </label>
              <select
                ref={paymentTypeRef}
                name="paymentType"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Payment Type"
              >
                <option value="">Select Payment Type</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
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
      <dialog id="modal-update" className="modal modal-middle ">
        <div className="max-w-2xl rounded-lg modal-box">
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
                htmlFor="hall"
                className="block mb-1 text-sm text-gray-500"
              >
                Hall
              </label>
              <select
                ref={hallIdUpdateRef}
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
                name="hall"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Hall"
              >
                <option value="">None</option>
                {halls?.map((hall) => (
                  <option value={hall.id} key={hall.id}>
                    {hall.name}(Max count:{hall.max_count}) (Min count:
                    {hall.min_count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="package"
                className="block mb-1 text-sm text-gray-500"
              >
                Package
              </label>
              <select
                ref={packageUpdateRef}
                name="package"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Package"
                value={selectedPackage}
                onChange={handlePackageChange}
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

            {/* Child Count */}
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="startTime"
                className="block mb-1 text-sm text-gray-500"
              >
                Start Time{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={startTimeUpdateRef}
                type="time"
                name="startTime"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Start Time"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="endTime"
                className="block mb-1 text-sm text-gray-500"
              >
                End Time{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={endTimeUpdateRef}
                type="time"
                name="endTime"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Start Time"
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="date"
                className="block mb-1 text-sm text-gray-500"
              >
                Date <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={dateUpdateRef}
                type="date"
                name="date"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Date"
                min={new Date()
                  .toISOString()
                  .slice(0, new Date().toISOString().lastIndexOf(":"))}
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="guestCount"
                className="block mb-1 text-sm text-gray-500"
              >
                Guest Count{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={guestCountUpdateRef}
                min={0}
                type="number"
                name="guestCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Guest Count"
                onChange={handleGuestCountChange}
              />
            </div>
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="roomNo"
                className="block mb-1 text-sm text-gray-500"
              >
                Changing Room
              </label>
              <select
                ref={roomIdUpdateRef}
                name="room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Room"
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
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Status
              </label>
              <select
                name="status"
                ref={reservationStatusUpdateRef}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
              >
                {/* <option value="">Select Status</option> */}
                <option value="booked">Booked</option>
                <option value="paid">Paid</option>
                <option value="advanced">Advanced</option>
                <option value="cancelled">Cancelled</option>
                <option value="check-in">Check-in</option>
                {/* <option value="completed">Completed</option> */}
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="discount"
                className="block mb-1 text-sm text-gray-500"
              >
                Discount (%)
              </label>
              <input
                min={0}
                type="number"
                name="discount"
                ref={discountUpdateRef}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total Price"
                onChange={handleDiscountChange}
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="total"
                className="block mb-1 text-sm text-gray-500"
              >
                Total{" "}
              </label>
              <input
                min={0}
                type="number"
                name="total"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total"
                value={totalPrice}
                ref={totalUpdateRef}
                readOnly
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="subTotal"
                className="block mb-1 text-sm text-gray-500"
              >
                Sub Total{" "}
              </label>
              <input
                min={0}
                type="number"
                name="subTotal"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Total Price"
                ref={subTotalUpdateRef}
                value={subTotal}
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
                Advance Payment{" "}
              </label>
              <input
                ref={adanceAmtUpdateRef}
                min={0}
                type="number"
                name="advanceAmt"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Advance Payment"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="paymentType"
                className="block mb-1 text-sm text-gray-500"
              >
                Payment Type
              </label>
              <select
                ref={paymentTypeUpdateRef}
                name="paymentType"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Payment Type"
              >
                <option value="">Select Payment Type</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
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
