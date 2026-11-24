/** @format */

import React, { useEffect, useRef, useState } from "react";
import Page from "../../components/Page";
// import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  IconPencil,
  IconTrash,
  IconAlertTriangleFilled,
  IconFilterFilled,
  IconTransfer,
  IconEye,
  IconFilter,
  IconPlus,
  IconPrinter,
  IconReceipt,
  IconSearch,
  IconCalendarPlus,
  IconCalendarTime,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconMail,
  IconPhone,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import toast from "react-hot-toast";
import { mutate } from "swr";
import {
  addStock,
  stockTransfer,
  deleteStock,
  editStock,
  useStocks,
  stockTransferLog,
  stockConsumption,
  stockTransferLogExport,
} from "../../controllers/stock.controller";
import { useStores } from "../../controllers/store.controller";
import { useIngredientsItems } from "../../controllers/ingredient_item.controller";
import { getUserDetailsInLocalStorage } from "../../helpers/UserDetails";
import { clsx } from "clsx";
import "react-datepicker/dist/react-datepicker.css";
import Papa from "papaparse";

export default function StockConsumptionPage() {
  const user = getUserDetailsInLocalStorage();
  const { username: transfer_by } = user;
  const filters = [
    { key: "today", value: "Today" },
    { key: "tomorrow", value: "Tomorrow" },
    { key: "yesterday", value: "Yesterday" },
    { key: "last_7days", value: "Last 7 Days" },
    { key: "this_month", value: "This Month" },
    { key: "last_month", value: "Last Month" },
    { key: "custom", value: "Custom" },
  ];

  const [selectedItems, setSelectedItems] = useState([]);
  const fromDateRef = useRef();
  const toDateRef = useRef();
  const filterTypeRef = useRef();
  const fromStoreIdRef = useRef();
  const toStoreIdRef = useRef();
  const itemIdStoreRef = useRef();
  const transferQuantityRef = useRef();

  const now = new Date();
  const defaultDateFrom = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const defaultDateTo = `${now.getFullYear()}-${(now.getMonth() + 2)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

  async function btnTransfer() {
    const item_id = itemIdStoreRef.current.value || null;
    const from_store = fromStoreIdRef.current.value || null;
    const quantity = transferQuantityRef.current.value || null;
    const to_store = toStoreIdRef.current.value || null;

    console.log("item_id", item_id);
    console.log("from_store", from_store);
    console.log("quantity", quantity);
    console.log("to_store", to_store);

    if (!item_id) {
      toast.error("Please Provide Item Name!");
      return;
    }
    if (!from_store) {
      toast.error("Please Select Store!");
      return;
    }
    if (!quantity) {
      toast.error("Please provide quantity!");
      return;
    }
    if (!to_store) {
      toast.error("Please Select Store!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await stockTransfer({
        from_store,
        to_store,
        item_id,
        quantity,
        transfer_by,
      });

      if (res.status == 200) {
        itemIdStoreRef.current.value = null;
        fromStoreIdRef.current.value = null;
        transferQuantityRef.current.value = null;
        toStoreIdRef.current.value = null;

        if (APIURL) {
          await mutate(APIURL);
        }
        toast.dismiss();
        toast.success(res.data.message);
        toast.success("Stock Transfer Successfully");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  const [state, setState] = useState({
    search: "",
    spage: 1,
    filter: filters[0].key,
    fromDate: null,
    toDate: null,
    roomNo: null,
    tableId: null,
    customer: null,
    limits: 15,

    printSettings: null,
    storeSettings: null,
    currency: null,

    paymentTypes: [],
  });

  const {
    data: consumptions,
    APIURL,
    error,
    isLoading,
  } = stockConsumption({
    // type: state.filter,
    // from: state.fromDate,
    // to: state.toDate,
    // page: state.spage,
    // limit: state.limits,
  });

  const { data: transfersExport } = stockTransferLogExport({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
    page: state.spage,
    limit: state.limits,
  });

  const { data: IngredientsItems } = useIngredientsItems({
    page: state.spage,
    perPage: 100,
  });

  const {
    data: stores,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useStores();
  console.log("stores", stores);

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please try later!</Page>;
  }

  const { currentPage, totalPages, totalRecords } = consumptions;
  // pagination
  const btnPaginationFirstPage = () => {
    setState({
      ...state,
      spage: 1,
    });
  };
  const btnPaginationLastPage = () => {
    setState({
      ...state,
      spage: totalPages,
    });
  };
  const btnPaginationNextPage = () => {
    if (currentPage == totalPages) {
      return;
    }
    setState({
      ...state,
      spage: state.spage + 1,
    });
  };
  const btnPaginationPreviousPage = () => {
    if (currentPage == 1) {
      return;
    }
  };
  // pagination

  const ExcelExport = () => {
    try {
      setState({
        ...state,
        limits: 500,
      });
      // Map the data to the desired format for export
      const csvData = transfersExport?.data.map((transfer) => ({
        "Transfer ID": transfer.id || "N/A",
        "From Store ID": transfer.from_store || "N/A",
        "From Store Name": transfer.from_store_name || "N/A",
        "To Store ID": transfer.to_store || "N/A",
        "To Store Name": transfer.to_store_name || "N/A",
        "Item ID": transfer.b_item_id || "N/A",
        "Item Name": transfer.item_name || "N/A",
        Unit: transfer.product_purchase_unit || "N/A",
        Quantity: transfer.quantity || "N/A",
        "Created At": transfer.create_at
          ? new Date(transfer.create_at).toLocaleString("en-US", {
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
      link.download = "stock_transfers.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Exporting Data: ", csvData);
    } catch (error) {
      console.error("Error exporting data: ", error);
    }
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-light">Stock Consumption Details</h3>

        <div className="flex items-center gap-2">
          {/* <button
            onClick={ExcelExport}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            📄 Export CSV
          </button> */}
          <button
            onClick={() => document.getElementById("filter-dialog").showModal()}
            className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition"
          >
            <IconFilter />
          </button>
        </div>
      </div>

      {/* data */}
      <h3 className="mt-6 mb-4 text-base">
        Showing Stock Consumption Details for{" "}
        {filters.find((f) => f.key == state.filter).value}
      </h3>
      {consumptions.data.length == 0 ? (
        <div className="text-center w-full h-[50vh] flex flex-col items-center justify-center text-gray-500">
          <img
            src="/assets/illustrations/no-invoice.svg"
            alt="no consumptions"
            className="w-full md:w-60"
          />
          <p>No Results found! Change the Filter!</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table table-sm table-zebra border w-full">
            <thead>
              <tr>
                <th>Room Service ID:</th>
                <th>Consumption Date</th>
                <th>request_by</th>
                <th>View Items</th>
              </tr>
            </thead>
            <tbody>
              {consumptions?.data?.map((consumption, index) => {
                const {
                  stock_consumption_id,
                  room_service_id,
                  date,
                  request_by,
                  items,
                } = consumption;

                return (
                  <tr key={index}>
                    <td>{room_service_id}</td>
                    <td>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(date))}
                    </td>
                    <td>{request_by}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedItems(items);
                          document.getElementById("modal-viewMore").showModal();
                        }}
                        className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                      >
                        <IconChevronRight stroke={iconStroke} />
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

      {/* pagination */}
      <div className="flex justify-end mt-8">
        <div className="join">
          <button
            onClick={btnPaginationFirstPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == 1,
            })}
          >
            <IconChevronsLeft stroke={iconStroke} />
          </button>
          <button
            onClick={btnPaginationPreviousPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == 1,
            })}
          >
            <IconChevronLeft stroke={iconStroke} />
          </button>
          <button className="text-gray-500 bg-gray-100 join-item btn btn-sm">
            Page {currentPage}
          </button>
          <button
            onClick={btnPaginationNextPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == totalPages,
            })}
          >
            <IconChevronRight stroke={iconStroke} />
          </button>
          <button
            onClick={btnPaginationLastPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == totalPages,
            })}
          >
            <IconChevronsRight stroke={iconStroke} />
          </button>
        </div>
      </div>
      <div className="mt-4 text-end">
        <p>
          Showing {consumptions.data.length} of {totalRecords}
        </p>
      </div>
      {/* pagination */}

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

      {/* ViewMore Button Model */}

      <dialog
        id="modal-viewMore"
        // className="modal modal-bottom sm:modal-middle"
        className="modal modal-middle "
      >
        <div className="max-w-5xl rounded-lg modal-box">
          <h3 className="text-lg font-bold">View Return Items</h3>

          <div className="flex w-full gap-4 my-4"></div>
          <div className="w-full mt-8">
            <table className="w-full overflow-x-auto border">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                    Item ID
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-40">
                    Item Name
                  </th>

                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                    Item Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedItems?.map((data, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-start">{data.item_id}</td>
                    <td className="px-3 py-2 text-start">{data.item_name}</td>
                    <td className="px-3 py-2 text-start">{data.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                // onClick={() => setSelectedItemId(null)}
                className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
              >
                Close
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center my-6 "></div>
      </dialog>
    </Page>
  );
}
