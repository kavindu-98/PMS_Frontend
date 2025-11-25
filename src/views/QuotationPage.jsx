/** @format */

import React, { useRef, useState, useEffect } from "react";
import Page from "../components/Page";
import { IconPlus, IconFilter, IconReceipt, IconX } from "@tabler/icons-react";
import { iconStroke } from "../config/config";

import toast from "react-hot-toast";
import { mutate } from "swr";
import { Link, useNavigate } from "react-router-dom";
import { useQuotation } from "../controllers/quotaion.controller";
import { setDetailsForQuotationReceiptPrint } from "../helpers/ReceiptHelper";
import { CURRENCIES } from "../config/currencies.config";
import { getOrdersInit } from "../controllers/orders.controller";

export default function QuotationPage() {
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState([]);
  const [total, setTotal] = useState("");
  const [subTotal, setSubTotal] = useState("");
  const [totalTax, setTotalTax] = useState("");
  const [customerID, setCustomerID] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");

  const filters = [
    { key: "today", value: "Today" },
    { key: "yesterday", value: "Yesterday" },
    { key: "last_7days", value: "Last 7 Days" },
    { key: "this_month", value: "This Month" },
    { key: "last_month", value: "Last Month" },
    { key: "custom", value: "Custom" },
  ];

  const [state, setState] = useState({
    search: "",
    searchResults: [],
    spage: 1,
    filter: filters[0].key,
    fromDate: null,
    toDate: null,
    roomNo: null,
    tableId: null,
    customer: null,

    printSettings: null,
    storeSettings: null,
    currency: null,

    paymentTypes: [],
  });

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

  const btnAddNew = () => {
    navigate(`/dashboard/quotations-add`);
  };
  useEffect(() => {
    _init();
  }, []);
  const { storeSettings, currency, printSettings } = state;

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

  const btnSearch = async () => {
    const searchQuery = searchRef.current.value;
    if (!new String(searchQuery).trim()) {
      return;
    }

    try {
      toast.loading("Please wait...");
      // const res = await searchInvoices(new String(searchQuery).trim());
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
  const {
    APIURL,
    data: quotations,
    error,
    isLoading,
  } = useQuotation({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
  });

  const btnPrintReceipt = async () => {
    if (bookingDetails.length === 0) {
      toast.error("At least one quotation need to print.");
      return;
    }

    try {
      toast.loading("Preparing receipt...");

      toast.dismiss();

      const page_format = printSettings?.page_format || null;
      const is_enable_print = printSettings?.is_enable_print || 0;

      const detailsForReceipt = {
        // bookingDetails: bookingDetails?.map((booking) => ({
        //   ...booking,
        //   weddingPackageName: weddingPackageName, // Pass the weddingPackageName
        //   dayoutPackageName: dayoutPackageName, // Pass the dayoutPackageName
        //   additionalPackageName: additionalPackageName, //Pass additionalPackageName
        // })),
        subtotal: subTotal,
        taxTotal: totalTax,
        serviceCharge: serviceCharge,
        finalTotal: total,
        storeSettings: storeSettings,
        printSettings: printSettings,
        currency: currency,
        customer: customerID,
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

  return (
    <Page>
      <div className="flex flex-wrap gap-4 flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex gap-6">
          <h3 className="text-2xl">Quotation</h3>
          <button
            onClick={() => {
              btnAddNew();
            }}
            className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
          >
            <IconPlus size={22} stroke={iconStroke} /> New
          </button>
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
            // onClick={btnSearch}
            className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
          >
            Search
          </button>

          <button
            // onClick={ExcelExport}
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
      {state.searchResults.length > 0 && (
        <div className="mt-6">
          <h3>Showing Search Result for "{state.search}"</h3>
          <div className="overflow-x-auto w-full">
            <table className="table table-sm table-zebra border w-full">
              <thead>
                <tr>
                  <th>Quotation ID:</th>
                  <th>Customer ID</th>
                  <th>Total</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {state.searchResults?.data.map((quotation, index) => {
                  const {
                    quotation_id,
                    customer_id,
                    total,
                    create_at,
                    services,
                  } = quotation;

                  return (
                    <tr key={index}>
                      <td>{quotation_id}</td>

                      <td>{customer_id}</td>
                      <td>
                        {state.currency}
                        {total}
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(create_at))}
                      </td>
                      <td className="flex items-center gap-2">
                        <button
                          // onClick={() => {
                          //   btnViewReceipt(services);
                          // }}
                          className="btn btn-sm btn-circle text-slate-500"
                        >
                          <IconReceipt stroke={iconStroke} />
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
        Showing Invoices for {filters.find((f) => f.key == state.filter).value}
      </h3>
      {quotations?.length == 0 ? (
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
                <th>Quotation ID:</th>
                <th>Customer ID</th>
                <th>Total</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations?.data.map((quotation, index) => {
                const {
                  quotation_id,
                  customer_id,
                  total,
                  TAX,
                  service_charge,
                  sub_total,
                  create_at,
                  services,
                } = quotation;

                return (
                  <tr key={index}>
                    <td>{quotation_id}</td>

                    <td>{customer_id}</td>
                    <td>
                      {state.currency}
                      {total}
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(create_at))}
                    </td>
                    <td className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBookingDetails(services);
                          setTotal(total);
                          setServiceCharge(service_charge);
                          setSubTotal(sub_total);
                          setTotalTax(TAX);
                          setCustomerID(customer_id);
                          document
                            .getElementById("modal-view-quotation")
                            .showModal();
                        }}
                        className="btn btn-sm btn-circle text-slate-500"
                      >
                        <IconReceipt stroke={iconStroke} />
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

          {/* View Quotation Details */}
          <dialog
            id="modal-view-quotation"
            // className="modal modal-bottom sm:modal-middle"
            className="modal modal-middle "
          >
            <div className="max-w-5xl rounded-lg modal-box">
              <h3 className="text-xl font-bold">View Quotation</h3>

              <div className="p-2 m-4">
                <div className="w-full mt-8">
                  <table className="w-full overflow-x-auto border">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                          #
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-15">
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
                        <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                          Unit Price
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                          Amount
                        </th>
                        {/* <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                          Excluded Price
                        </th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {bookingDetails?.map((booking, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-3 py-2">{index + 1}</td>
                          <td className="px-3 py-2">
                            {booking.q_type} {booking.service_id}
                          </td>
                          <td className="px-3 py-2">{booking.description}</td>
                          <td className="px-3 py-2">{booking.check_in}</td>
                          <td className="px-3 py-2">{booking.check_out}</td>
                          <td className="px-3 py-2">{booking.people_count}</td>
                          <td className="px-3 py-2">{booking.unit_price}</td>
                          <td className="px-3 py-2">{booking.amount}</td>
                          {/* <td className="px-3 py-2">
                            {booking.excluded_price}
                          </td> */}
                        </tr>
                      ))}

                      {/* Subtotal, Tax, Discount, and Total Row */}
                      <tr className="font-semibold bg-gray-50">
                        <td colSpan="6" className="px-3 py-2 text-start">
                          Subtotal:
                        </td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">{subTotal || 0.0}</td>
                        <td></td>
                      </tr>
                      <tr className="font-semibold bg-gray-100">
                        <td colSpan="6" className="px-3 py-2 text-start">
                          Total Tax:
                        </td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">{totalTax || 0.0}</td>
                        <td></td>
                      </tr>
                      <tr className="font-semibold bg-gray-50">
                        <td colSpan="6" className="px-3 py-2 text-start">
                          Service Charge:
                        </td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">{serviceCharge || 0.0}</td>
                        <td></td>
                      </tr>
                      <tr className="font-bold bg-gray-100">
                        <td colSpan="6" className="px-3 py-2 text-start">
                          Total:
                        </td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">{total || 0.0}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-action">
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-300 active:scale-95 hover:shadow-lg"
                    onClick={() => btnPrintReceipt()}
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={() => {
                      setBookingDetails([]);
                      document.getElementById("modal-view-quotation").close();
                    }}
                    className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </dialog>
          {/* View Quotation Details */}
        </div>
      </dialog>
    </Page>
  );
}
