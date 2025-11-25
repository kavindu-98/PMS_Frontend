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
  stockTransferLogExport,
} from "../../controllers/stock.controller";
import { useStores } from "../../controllers/store.controller";
import { useIngredientsItems } from "../../controllers/ingredient_item.controller";
import { getUserDetailsInLocalStorage } from "../../helpers/UserDetails";
import { clsx } from "clsx";
import "react-datepicker/dist/react-datepicker.css";
import Papa from "papaparse";

export default function StockTransferLogPage() {
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
        document.getElementById("modal-transfer").close();
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
    data: transfers,
    APIURL,
    error,
    isLoading,
  } = stockTransferLog({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
    page: state.spage,
    limit: state.limits,
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

  const { currentPage, totalPages, totalRecords } = transfers;
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
        <h3 className="text-3xl font-light">Stock Transfer Details</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              document.getElementById("modal-transfer").showModal()
            }
            className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
          >
            <IconTransfer size={22} stroke={iconStroke} /> Stock Transfer
          </button>
          <button
            onClick={ExcelExport}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            📄 Export CSV
          </button>
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
        Showing Stock Transfer Log Details for{" "}
        {filters.find((f) => f.key == state.filter).value}
      </h3>
      {transfers.data.length == 0 ? (
        <div className="text-center w-full h-[50vh] flex flex-col items-center justify-center text-gray-500">
          <img
            src="/assets/illustrations/no-invoice.svg"
            alt="no transfers"
            className="w-full md:w-60"
          />
          <p>No Results found! Change the Filter!</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table table-sm table-zebra border w-full">
            <thead>
              <tr>
                <th>Transfer ID:</th>
                <th>Transfer Date</th>
                <th>From Store</th>
                <th>To Store</th>
                <th>Item Batch ID</th>
                <th>Item Name</th>
                <th>Unit</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {transfers?.data?.map((transfer, index) => {
                const {
                  id,
                  b_item_id,
                  create_at,
                  from_store,
                  from_store_name,
                  item_name,
                  product_purchase_unit,
                  quantity,
                  to_store,
                  to_store_name,
                } = transfer;

                return (
                  <tr key={index}>
                    <td>{id}</td>
                    {/* <td>{orderIds}</td> */}
                    <td>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(create_at))}
                    </td>
                    <td>{from_store_name}</td>
                    <td>{to_store_name}</td>
                    <td>{b_item_id}</td>
                    <td>{item_name}</td>
                    <td>{product_purchase_unit}</td>
                    <td className="font-bold">{quantity}</td>
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
          Showing {transfers.data.length} of {totalRecords}
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

          {/* stock transfer */}
          <dialog
            id="modal-transfer"
            className="modal modal-bottom sm:modal-middle"
          >
            <div className="modal-box">
              <h3 className="text-lg font-bold">Stock Transfer</h3>

              <div className="flex w-full gap-4 my-4"></div>
              <div className="flex-1">
                <label
                  htmlFor="from-store"
                  className="block mb-1 text-sm text-gray-500"
                >
                  From Store
                </label>
                <select
                  ref={fromStoreIdRef}
                  name="from-store"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  placeholder="Select Store"
                >
                  <option value="" hidden>
                    Select Store
                  </option>
                  {stores?.map((store, index) => (
                    <option key={index} value={store.id}>
                      {store.storeName} - {store.storeLocation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 my-4">
                <label
                  htmlFor="item_name"
                  className="block mb-1 text-sm text-gray-500"
                >
                  Item Name
                </label>
                <select
                  ref={itemIdStoreRef}
                  name="item_name"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  placeholder="Select Item"
                >
                  <option value="" hidden>
                    Select Item Name
                  </option>
                  {IngredientsItems?.data?.map((item, index) => {
                    return (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="flex-1">
                  <label
                    htmlFor="stockQty"
                    className="block mb-1 text-sm text-gray-500"
                  >
                    {" "}
                    Add Transfer Qty
                  </label>
                  <input
                    ref={transferQuantityRef}
                    type="text"
                    name="stockQty"
                    className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    placeholder="Enter Transfer Qty"
                  />
                </div>
              </div>

              <div className="my-4">
                <label
                  htmlFor="from-store"
                  className="block mb-1 text-sm text-gray-500"
                >
                  To Store
                </label>
                <select
                  ref={toStoreIdRef}
                  name="from-store"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  placeholder="Select Store"
                >
                  <option value="" hidden>
                    Select Store
                  </option>
                  {stores?.map((store, index) => (
                    <option key={index} value={store.id}>
                      {store.storeName} - {store.storeLocation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                    Close
                  </button>
                  <button
                    onClick={() => {
                      btnTransfer();
                    }}
                    className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
                  >
                    Transfer
                  </button>
                </form>
              </div>
            </div>
          </dialog>
          {/* stock transfer */}
        </div>
      </dialog>
      {/* filter dialog */}
    </Page>
  );
}
