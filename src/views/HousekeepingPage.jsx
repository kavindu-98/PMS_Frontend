/** @format */

import React, { useRef, useState, Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import Page from "../components/Page";
import moment from "moment";
import {
  IconEye,
  IconFilter,
  IconPencil,
  IconPlus,
  IconPrinter,
  IconReceipt,
  IconAlertTriangleFilled,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { iconStroke } from "../config/config";
import { toast } from "react-hot-toast";
import { mutate } from "swr";
import {
  useHousekeeping,
  useHousekeepers,
  addHousekeepingTask,
  updateHousekeepingTask,
  deleteHousekeepingTask,
} from "../controllers/housekeepers.controller";

import { useRooms, useServiceCharge } from "../controllers/settings.controller";
import Papa from "papaparse";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";

export default function HousekeepingPage() {
  const filters = [
    { key: "today", value: "Today" },
    { key: "tomorrow", value: "Tomorrow" },
    { key: "yesterday", value: "Yesterday" },
    { key: "last_7days", value: "Last 7 Days" },
    { key: "this_month", value: "This Month" },
    { key: "last_month", value: "Last Month" },
    { key: "custom", value: "Custom" },
  ];

  const statusValue = [
    { key: "Dirty", value: "Dirty", color: "text-red-500" },
    { key: "Prep", value: "Preparing", color: "text-yellow-600" },
    { key: "Ready", value: "Ready", color: "text-green-400" },
    { key: "Cleaning", value: "Cleaning", color: "text-yellow-300" },
    { key: "Done", value: "Done", color: "text-restro-green" },
    { key: "Do_Not_Disturb", value: "Do Not Disturb", color: "text-gray-500" },
    { key: "Inspect", value: "Inspect", color: "text-blue-500" },
    { key: "Out_Of_Order", value: "Out Of Order", color: "text-purple-500" },
  ];

  const [selectedStatuses, setSelectedStatuses] = useState("");
  const [assignedHousekeepers, setSelectedHousekeepers] = useState([]);

  const user = getUserDetailsInLocalStorage();

  const searchRef = useRef();
  const fromDateRef = useRef();
  const toDateRef = useRef();

  const roomIdRef = useRef();
  const dateRef = useRef();
  const startTimeRef = useRef();
  const endTimeRef = useRef();
  const taskPriorityRef = useRef();

  const roomIdUpdateRef = useRef();
  const dateUpdateRef = useRef();
  const startTimeUpdateRef = useRef();
  const endTimeUpdateRef = useRef();
  const taskPriorityUpdateRef = useRef();

  const filterTypeRef = useRef();
  const filterRoomTypeRef = useRef();
  const filterTableTypeRef = useRef();

  const now = new Date();
  const defaultDateFrom = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const defaultDateTo = `${now.getFullYear()}-${(now.getMonth() + 2)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

  const customerSearchRef = useRef();

  const [state, setState] = useState({
    search: "",
    searchResults: [],
    spage: 1,
    filter: filters[0].key,
    fromDate: null,
    toDate: null,
    customer: null,

    selectedHousekeepers: [],
    updatedTaskID: null,
    deleteTaskID: null,
  });

  const { selectedHousekeepers } = state;

  const {
    APIURL,
    data: housekeeping,
    error,
    isLoading,
  } = useHousekeeping({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
  });

  const {
    APIURL: housekeeperAPI,
    data: housekeepers,
    error: housekeeperdataError,
    isLoading: housekeeperIsLoading,
  } = useHousekeepers();

  const {
    data: RoomsData,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useRooms();

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please try later!</Page>;
  }

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;

    // Update only the selected task status
    setSelectedStatuses(newStatus);
  };

  // Helper function to get the status color
  const getStatusColor = (status) => {
    const selected = statusValue.find((s) => s.key === status);
    return selected ? selected.color : "";
  };

  // const btnSearch = async () => {
  //   const searchQuery = searchRef.current.value;
  //   if (!new String(searchQuery).trim()) {
  //     return;
  //   }

  //   try {
  //     toast.loading("Please wait...");
  //     const res = await searchInvoices(new String(searchQuery).trim());
  //     if (res.status == 200) {
  //       toast.dismiss();
  //       setState({
  //         ...state,
  //         search: searchQuery,
  //         searchResults: res.data,
  //         spage: 1,
  //       });
  //     } else {
  //       toast.dismiss();
  //       toast.error("No result found!");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     const message =
  //       error.response.data.message || "Something went wrong! Try later!";

  //     toast.dismiss();
  //     toast.error(message);
  //   }
  // };
  const btnClearSearch = () => {
    searchRef.current.value = null;

    setState({
      ...state,
      search: "",
      searchResults: [],
      spage: 1,
    });
  };

  const clear = () => {
    roomIdRef.current.value = null;
    dateRef.current.value = null;
    startTimeRef.current.value = null;
    endTimeRef.current.value = null;
    taskPriorityRef.current.value = null;
    setSelectedStatuses("");

    setState({
      ...state,
      selectedHousekeepers: [],
    });
  };

  const clearAssignHousekeepers = () => {
    setSelectedHousekeepers([]);
  };

  const btnAdd = async () => {
    const room_no = roomIdRef.current.value;
    const task_date = dateRef.current.value;
    const cleaning_start_time = startTimeRef.current.value;
    const cleaning_end_time = endTimeRef.current.value;
    const priority = taskPriorityRef.current.value;
    const assign_to = selectedHousekeepers;
    const status = selectedStatuses;
    const inspection_id = user.username;
    const inspection_status = "Pending";

    if (!room_no) {
      toast.error("Please provide room no!");
      return;
    }
    if (!task_date) {
      toast.error("Please provide task Date!");
      return;
    }
    if (!cleaning_start_time) {
      toast.error("Please provide cleaning start time!");
      return;
    }
    if (!cleaning_end_time) {
      toast.error("Please provide cleaning start time!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addHousekeepingTask(
        room_no,
        task_date,
        status,
        assign_to,
        inspection_id,
        inspection_status,
        priority,
        cleaning_start_time,
        cleaning_end_time
      );

      if (res.status == 200 || res.status == 201) {
        roomIdRef.current.value = null;
        dateRef.current.value = null;
        startTimeRef.current.value = null;
        endTimeRef.current.value = null;
        taskPriorityRef.current.value = null;
        setSelectedStatuses("");

        setState({
          ...state,
          selectedHousekeepers: [],
        });

        await mutate(APIURL);
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

  const btnDelete = async () => {
    const housekeepingDeleteID = state.deleteTaskID;
    try {
      toast.loading("Please wait...");
      const res = await deleteHousekeepingTask(housekeepingDeleteID);

      if (res.status == 200) {
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };

  const btnUpdate = async () => {
    const room_no = roomIdUpdateRef.current.value;
    const task_date = dateUpdateRef.current.value;
    const cleaning_start_time = startTimeUpdateRef.current.value;
    const cleaning_end_time = endTimeUpdateRef.current.value;
    const priority = taskPriorityUpdateRef.current.value;
    const assign_to = selectedHousekeepers;
    const status = selectedStatuses;
    const inspection_id = user.username;
    const inspection_status = "Pending";

    if (!room_no) {
      toast.error("Please provide room no!");
      return;
    }
    if (!task_date) {
      toast.error("Please provide task Date!");
      return;
    }
    if (!cleaning_start_time) {
      toast.error("Please provide cleaning start time!");
      return;
    }
    if (!cleaning_end_time) {
      toast.error("Please provide cleaning start time!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await updateHousekeepingTask(
        state.updatedTaskID,
        room_no,
        task_date,
        status,
        assign_to,
        inspection_id,
        inspection_status,
        priority,
        cleaning_start_time,
        cleaning_end_time
      );

      if (res.status == 200 || res.status == 201) {
        roomIdUpdateRef.current.value = null;
        dateUpdateRef.current.value = null;
        startTimeUpdateRef.current.value = null;
        endTimeUpdateRef.current.value = null;
        taskPriorityUpdateRef.current.value = null;
        setSelectedStatuses("");

        setState({
          ...state,
          selectedHousekeepers: [],
        });

        await mutate(APIURL);
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
    cleaning_end_time,
    cleaning_start_time,
    room_category,
    id,
    inspection_id,
    inspection_status,
    priority,
    room_no,
    status,
    task_date,
    house_keepers
  ) => {
    if (roomIdUpdateRef.current) {
      roomIdUpdateRef.current.value = room_no;
    }
    if (dateUpdateRef.current) {
      console.log("task_date", task_date);
      const task_date1 = new Date(task_date).toLocaleDateString("en-CA");
      console.log("task_date1", task_date1);
      dateUpdateRef.current.value = task_date1;
    }
    if (startTimeUpdateRef.current) {
      startTimeUpdateRef.current.value = cleaning_start_time;
    }
    if (endTimeUpdateRef.current) {
      endTimeUpdateRef.current.value = cleaning_end_time;
    }
    if (taskPriorityUpdateRef.current) {
      taskPriorityUpdateRef.current.value = priority;
    }
    setSelectedStatuses(status);
    const houseKeeperUnames = house_keepers.map(
      (keeper) => keeper.house_keeper_uname
    );
    setState({
      ...state,
      updatedTaskID: id,
      selectedHousekeepers: houseKeeperUnames,
    });

    const modal = document.getElementById("modal-update");
    if (modal) {
      modal.showModal();
    }
  };

  const ExcelExport = () => {
    // Check if there are search results; use them if available, otherwise fallback to invoices
    const dataToExport =
      state.searchResults.length > 0 ? state.searchResults : housekeeping;

    // Map the data to the desired format for export
    const csvData = dataToExport.map((invoice) => ({
      "Invoice ID": invoice.invoice_id || "N/A",
      "Created At":
        new Date(invoice.created_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }) || "N/A",
      "Sub Total": invoice.sub_total || "N/A",
      "Total Amount": invoice.total || "N/A",
      "Delivery Type": invoice.delivery_type || "N/A",
      "Room Number": invoice.room_details?.room_no || "N/A",
      "Room Status": invoice.room_details?.room_status || "N/A",
      "Check-in Date":
        new Date(invoice.room_details?.check_in_date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }) || "N/A",
      "Check-out Date":
        new Date(invoice.room_details?.check_out_date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }) || "N/A",
      "Guest Count": invoice.room_details?.guest_count || "N/A",
      "Final Price": invoice.room_details?.final_price || "N/A",
      "Booking Type": invoice.room_details?.booking_type || "N/A",
      "Advanced Amount": invoice.room_details?.advanced_amount || "N/A",
      Notes: invoice.room_details?.note || "N/A",
      "Customer ID": invoice.room_details?.customer_id || "N/A",
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
    link.download = "Invoices.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("Exporting Data: ", csvData);
  };

  return (
    <Page>
      <div className="flex flex-wrap gap-4 flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex gap-6">
          <h3 className="text-2xl">Housekeeping</h3>

          <button
            onClick={() => {
              document.getElementById("modal-add").showModal();
            }}
            className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
          >
            <IconPlus size={22} stroke={iconStroke} /> New
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center">
            <input
              ref={searchRef}
              defaultValue={state.search}
              type="text"
              placeholder="Search Invoices"
              className="bg-transparent placeholder:text-gray-400 outline-none block"
            />
            {state.search && (
              <button onClick={btnClearSearch} className="text-gray-400">
                <IconX stroke={iconStroke} size={18} />
              </button>
            )}
          </div> */}
          {/* <button
            // onClick={btnSearch}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            Search
          </button>
          <button
            onClick={ExcelExport}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            Export CSV
          </button> */}
          <button
            onClick={() => document.getElementById("filter-dialog").showModal()}
            className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition"
          >
            <IconFilter />
          </button>
        </div>
      </div>

      {/* search result */}
      {state.searchResults.length > 0 && (
        <div className="mt-6">
          <h3>Showing Search Result for "{state.search}"</h3>
          <div className="overflow-x-auto w-full">
            <table className="table table-sm table-zebra border w-full">
              <thead>
                <tr>
                  <th>Invoice ID:</th>
                  {/* <th>Order IDs</th> */}
                  <th>Tokens</th>
                  <th>Date</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Delivery Type</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Room / DayOut / Hall / Service</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {state.searchResults?.map((invoice, index) => {
                  const {
                    invoice_id,
                    created_at,
                    sub_total,
                    discount,
                    total,
                    table_id,
                    table_title,
                    floor,
                    delivery_type,
                    customer_type,
                    customer_id,
                    name,
                    email,
                    room_details,
                    orders,
                    payment_type_id,
                  } = invoice;

                  const orderIdsArr = orders.map((o) => o.order_id);
                  const tokenIdsArr = orders.map((o) => o.token_no);
                  const orderIds = orderIdsArr.join(", ");
                  const tokens = tokenIdsArr.join(", ");

                  return (
                    <tr key={index}>
                      <td>{invoice_id}</td>
                      {/* <td>{orderIds}</td> */}
                      <td>{tokens}</td>
                      <td>
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(created_at))}
                      </td>
                      <td>
                        {state.currency}
                        {sub_total}
                      </td>
                      <td>{state.currency}</td>
                      <td>
                        {state.currency}
                        {discount || "0.00"}
                      </td>
                      <td className="font-bold">
                        {state.currency}
                        {total}
                      </td>
                      <td>{delivery_type ? delivery_type : "N/A"}</td>
                      <td>
                        {customer_id ? (
                          <b>
                            {name}-({customer_id})
                          </b>
                        ) : (
                          "WALKIN"
                        )}
                      </td>
                      <td>
                        {table_id ? (
                          <b>
                            {table_title}-{floor}
                          </b>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        {room_details ? (
                          <b>
                            {room_details.room_no}-{room_details.booking_type}
                          </b>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            btnViewReceipt(
                              invoice_id,
                              orderIdsArr,
                              tokens,
                              payment_type_id
                            );
                          }}
                          className="btn btn-sm btn-circle text-slate-500"
                        >
                          <IconReceipt stroke={iconStroke} />
                        </button>
                        <button
                          onClick={() => {
                            btnPrintReceipt(
                              invoice_id,
                              orderIdsArr,
                              tokens,
                              payment_type_id
                            );
                          }}
                          className="btn btn-sm btn-circle text-slate-500"
                        >
                          <IconPrinter stroke={iconStroke} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* search result */}

      {/* data */}
      <h3 className="mt-6 mb-4 text-base">
        Showing housekeeping for{" "}
        {filters.find((f) => f.key == state.filter).value}
      </h3>
      {housekeeping?.data.length == 0 ? (
        <div className="text-center w-full h-[50vh] flex flex-col items-center justify-center text-gray-500">
          <img
            src="/assets/illustrations/no-invoice.svg"
            alt="no invoices"
            className="w-full md:w-60"
          />
          <p>No Results found! Change the Filter!</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table table-sm table-zebra border w-full">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Room No</th>
                <th>Room Type</th>
                <th>Status</th>
                <th>Task Date</th>
                <th>Cleaning Start Time</th>
                <th>Cleaning End Time</th>
                <th>Assigned to</th>
                <th>Inspect By</th>
                <th>Inspect Status</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {housekeeping?.data.map((housekeep, index) => {
                const {
                  cleaning_end_time,
                  cleaning_start_time,
                  room_category,
                  id,
                  inspection_id,
                  inspection_status,
                  priority,
                  room_no,
                  status,
                  task_date,
                  house_keepers,
                  tenant_id,
                } = housekeep;

                const getStatusInfo = (status) =>
                  statusValue.find((item) => item.key === status) || {};

                return (
                  <tr key={index}>
                    <td>{id}</td>
                    {/* <td>{orderIds}</td> */}
                    <td>{room_no}</td>
                    <td>{room_category}</td>
                    <td className={getStatusInfo(status).color}>
                      {getStatusInfo(status).value}
                    </td>
                    <td>{new Date(task_date).toLocaleDateString("en-CA")}</td>
                    <td>
                      {moment(cleaning_start_time, "HH:mm:ss").format(
                        "hh.mm A"
                      )}
                    </td>
                    <td>
                      {moment(cleaning_end_time, "HH:mm:ss").format("hh.mm A")}
                    </td>
                    <td>
                      {" "}
                      <button
                        onClick={() => {
                          document
                            .getElementById("modal-view-housekeepers")
                            .showModal();
                          setSelectedHousekeepers(house_keepers);
                        }}
                        className="btn btn-sm btn text-slate-500"
                      >
                        View
                      </button>
                    </td>
                    <td>{inspection_id}</td>
                    <td>{inspection_status}</td>
                    <td>{priority}</td>

                    <td className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          btnShowUpdate(
                            cleaning_end_time,
                            cleaning_start_time,
                            room_category,
                            id,
                            inspection_id,
                            inspection_status,
                            priority,
                            room_no,
                            status,
                            task_date,
                            house_keepers
                          );
                        }}
                        className="btn btn-sm btn-circle text-slate-500"
                      >
                        <IconPencil stroke={iconStroke} />
                      </button>
                      <button
                        onClick={() => {
                          setState({
                            ...state,
                            deleteTaskID: id,
                          });
                          document.getElementById("modal-delete").showModal();
                        }}
                        className="btn btn-sm btn-circle text-red-500"
                      >
                        <IconTrash stroke={iconStroke} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      {/* filter dialog */}

      {/* add dialog */}

      <dialog id="modal-add" className="modal modal-middle ">
        <div className="max-w-2xl rounded-lg modal-box">
          <h3 className="text-lg font-bold">Add Housekeeping Task</h3>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="hall"
                className="block mb-1 text-sm text-gray-500"
              >
                Room
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
                      {room.room_no} {room.room_category}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading rooms...</option>
                )}
              </select>
            </div>
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
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="startTime"
                className="block mb-1 text-sm text-gray-500"
              >
                Cleaning Start Time{" "}
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
                Cleaning End Time{" "}
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
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Room Status
              </label>
              <select
                name="room-status"
                className={`w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light  ${getStatusColor(
                  selectedStatuses
                )}`}
                value={selectedStatuses}
                onChange={(e) => handleStatusChange(e)}
              >
                {statusValue.map((statusOption) => (
                  <option
                    value={statusOption.key}
                    className={statusOption.color}
                  >
                    {statusOption.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="assign_emp"
                className="block mb-1 text-sm text-gray-500"
              >
                Priority
              </label>
              <select
                name="status"
                ref={taskPriorityRef}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select a Priority"
              >
                <option value="">Select a Priority</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Assignor
              </label>
              <input
                defaultValue={user.username}
                type="text"
                disabled
                name="Assignor"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select a Assignor"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="assign_emp"
                className="block mb-1 text-sm text-gray-500"
              >
                Assign to
              </label>
              <select
                name="status"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
                onChange={(e) => {
                  if (e.target.value) {
                    setState({
                      ...state,
                      selectedHousekeepers: [
                        ...new Set([...selectedHousekeepers, e.target.value]),
                      ],
                    });
                  }
                }}
              >
                <option value="">Select a Housekeeper</option>
                {housekeepers && housekeepers?.data.length > 0 ? (
                  housekeepers?.data.map((housekeeper) => (
                    <option
                      key={housekeeper.id}
                      value={housekeeper.reference_code_id}
                    >
                      {housekeeper.reference_code_id} - {housekeeper.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading Housekeepers...</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full mt-4">
            {selectedHousekeepers?.map((s, i) => (
              <div
                key={i}
                className="bg-gray-100 text-sm p-2 text-gray-400 rounded-full flex items-center gap-1"
              >
                {s}
                <button
                  onClick={() => {
                    setState({
                      ...state,
                      selectedHousekeepers: selectedHousekeepers.filter(
                        (housekeepers) => housekeepers != s
                      ),
                    });
                  }}
                  className="text-red-400"
                >
                  <IconX stroke={iconStroke} size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  clear();
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
                Assign
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* add dialog */}

      {/* update dialog */}

      <dialog id="modal-update" className="modal modal-middle ">
        <div className="max-w-2xl rounded-lg modal-box">
          <h3 className="text-lg font-bold">Update Housekeeping Task : </h3>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="hall"
                className="block mb-1 text-sm text-gray-500"
              >
                Room
              </label>
              <select
                ref={roomIdUpdateRef}
                name="room"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Room"
              >
                <option value="">Select Room</option>
                {RoomsData && RoomsData?.length > 0 ? (
                  RoomsData.map((room) => (
                    <option key={room.id} value={room.room_no}>
                      {room.room_no} {room.room_category}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading rooms...</option>
                )}
              </select>
            </div>
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
          </div>

          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="startTime"
                className="block mb-1 text-sm text-gray-500"
              >
                Cleaning Start Time{" "}
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
                Cleaning End Time{" "}
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
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Room Status
              </label>
              <select
                name="room-status"
                className={`w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light  ${getStatusColor(
                  selectedStatuses
                )}`}
                value={selectedStatuses}
                onChange={(e) => handleStatusChange(e)}
              >
                {statusValue.map((statusOption) => (
                  <option
                    value={statusOption.key}
                    className={statusOption.color}
                  >
                    {statusOption.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="assign_emp"
                className="block mb-1 text-sm text-gray-500"
              >
                Priority
              </label>
              <select
                name="status"
                ref={taskPriorityUpdateRef}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select a Priority"
              >
                <option value="">Select a Priority</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex w-full gap-4 mt-4">
            <div className="flex-1">
              <label
                htmlFor="status"
                className="block mb-1 text-sm text-gray-500"
              >
                Assignor
              </label>
              <input
                defaultValue={user.username}
                type="text"
                disabled
                name="Assignor"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select a Assignor"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="assign_emp"
                className="block mb-1 text-sm text-gray-500"
              >
                Assign to
              </label>
              <select
                name="status"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Status"
                onChange={(e) => {
                  if (e.target.value) {
                    setState({
                      ...state,
                      selectedHousekeepers: [
                        ...new Set([...selectedHousekeepers, e.target.value]),
                      ],
                    });
                  }
                }}
              >
                <option value="">Select a Housekeeper</option>
                {housekeepers && housekeepers?.data.length > 0 ? (
                  housekeepers?.data.map((housekeeper) => (
                    <option
                      key={housekeeper.id}
                      value={housekeeper.reference_code_id}
                    >
                      {housekeeper.reference_code_id} - {housekeeper.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading Housekeepers...</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full mt-4">
            {selectedHousekeepers?.map((s, i) => (
              <div
                key={i}
                className="bg-gray-100 text-sm p-2 text-gray-400 rounded-full flex items-center gap-1"
              >
                {s}
                <button
                  onClick={() => {
                    setState({
                      ...state,
                      selectedHousekeepers: selectedHousekeepers.filter(
                        (housekeepers) => housekeepers != s
                      ),
                    });
                  }}
                  className="text-red-400"
                >
                  <IconX stroke={iconStroke} size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  clear();
                }}
                className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdate();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* Update dialog */}

      {/* View Housekeeper dialog */}
      <dialog
        id="modal-view-housekeepers"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">View Housekeepers</h3>

          <table className="table-auto w-full border-collapse border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Housekeeper ID</th>
                <th className="p-2 border">Username</th>
              </tr>
            </thead>
            <tbody>
              {assignedHousekeepers.map((keeper, index) => (
                <tr key={index} className="text-center">
                  <td className="p-2 border">{keeper.house_keeper_uname}</td>
                  <td className="p-2 border">{keeper.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={() => {
                  clearAssignHousekeepers();
                }}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* View Housekeeper dialog */}

      {/* Delete Box */}
      <dialog
        id="modal-delete"
        className="modal fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Modal Box */}
        <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-auto z-10">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Are you sure you want to delete this housekeeping task!
            </h2>
          </div>

          <div className="mt-4 text-center">
            <div className="mt-2 p-4 bg-red-100 rounded-lg text-left">
              <div className="flex items-center">
                <IconAlertTriangleFilled
                  className="text-red-600 mr-2"
                  size={24}
                />
                <p className="text-red-700 font-bold text-lg">Warning</p>
              </div>
              <p className="text-red-700 mt-1 text-sm">
                This housekeeping task will be <b>permanently deleted</b>
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => {
                document.getElementById("modal-delete").close();
                setState({
                  ...state,
                  deleteTaskID: null,
                });
              }}
              className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-6 py-3 bg-gray-200 text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                btnDelete();
                document.getElementById("modal-delete").close();
              }}
              className="rounded-lg hover:bg-red-500 transition active:scale-95 hover:shadow-lg px-6 py-3 bg-red-700 text-white"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </dialog>
    </Page>
  );
}
