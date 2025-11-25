/** @format */

import { iconStroke } from "../../config/config";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Page from "../../components/Page";
// import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconChevronsRight,
  IconChevronLeft,
  IconAlertTriangleFilled,
  IconChevronsLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import {
  getOrderMenuItems,
  getOrderMenuRawItems,
  useStocksExpenses,
  getStockExpenseBatchesData,
  exportcsv,
} from "../../controllers/stock.expenses.controller";
import { clsx } from "clsx";

import moment from "moment-timezone";
import "moment-timezone";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import Papa from "papaparse";
import { saveAs } from "file-saver";

const formattedDate = (d) => {
  return moment(d).tz("Asia/Colombo").format("YYYY-MM-DD");
};

function StockExpensesPage() {
  const [tableData, settableData] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [orderMenuItemsData, setOrderMenuItemsData] = useState([]);
  const [menuRawItemsData, setMenuRawItemsData] = useState([]);
  const [batchDataGrid, setBatchDataGrid] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filterData, setFilterData] = useState({
    totalPages: 1,
    currentPage: 1,
    startDate: formattedDate(),
    endDate: formattedDate(),
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const itemResult = useStocksExpenses({ perPage: 1000 });
  useEffect(() => {
    (async () => {
      const data = await useStocksExpenses({
        page: filterData.currentPage,
        startDate: formattedDate(filterData.startDate),
        endDate: formattedDate(filterData.endDate),
      });
      // console.log("table data from endpoint => ",data);
      settableData(data.data.data || []);
    })();
  }, [filterData]);

  useEffect(() => {
    (async () => {
      const response = await useStocksExpenses({
        page: filterData.currentPage,
        startDate: formattedDate(filterData.startDate),
        endDate: formattedDate(filterData.endDate),
      });

      const {
        page: currentPage = 1,
        totalPages = 1,
        totalItems = 0,
      } = response?.data?.pagination || {};

      console.log("Pagination Details:", {
        currentPage,
        totalPages,
        totalItems,
      });
      setPagination({ currentPage, totalPages, totalItems });
      settableData(response?.data?.data || []); // Update table data
    })();
  }, [filterData]);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(moment().tz("Asia/Colombo").format("h:mm:ss a"));
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, []);

  //const { itemNames ,currentPage, totalPages} = data;
  const itemNames = null;

  const itemIdRef = useRef();
  const unitRef = useRef();
  const totalQtyRef = useRef();
  const costPriceRef = useRef();
  const totalCostPriceRef = useRef();
  const unitPriceRef = useRef();
  const addedQuantityRef = useRef();
  const expiredDateRef = useRef();

  const handleDateChange = (value, name) => {
    if (name === "startDate") {
      setFilterData((ps) => ({
        ...ps,
        [name]: value,
        endDate: value,
        categoryId: null,
        currentPage: 1,
      }));
    } else {
      setFilterData((ps) => ({
        ...ps,
        [name]: value,
      }));
    }
  };

  //  pagination prev
  // const btnPaginationFirstPage = () => {
  //   setFilterData((ps) => ({ ...ps, currentPage: 1 }));
  // };
  // const btnPaginationLastPage = () => {
  //   setFilterData((ps) => ({ ...ps, currentPage: totalPages }));
  // };

  // const btnPaginationNextPage = () => {
  //   if (currentPage == totalPages) {
  //     return;
  //   }
  //   setFilterData((ps) => ({ ...ps, currentPage: currentPage + 1 }));
  // };
  // const btnPaginationPreviousPage = () => {
  //   if (currentPage == 1) {
  //     return;
  //   }
  //   setFilterData((ps) => ({ ...ps, currentPage: currentPage - 1 }));
  // };

  // pagination

  // pagination

  // pagination

  const btnPaginationFirstPage = () => {
    setFilterData((ps) => ({ ...ps, currentPage: 1 }));
  };

  const btnPaginationLastPage = () => {
    setFilterData((ps) => ({ ...ps, currentPage: pagination.totalPages }));
  };

  const btnPaginationNextPage = () => {
    if (pagination.currentPage === pagination.totalPages) return;
    setFilterData((ps) => ({ ...ps, currentPage: pagination.currentPage + 1 }));
  };

  const btnPaginationPreviousPage = () => {
    if (pagination.currentPage === 1) return;
    setFilterData((ps) => ({ ...ps, currentPage: pagination.currentPage - 1 }));
  };

  //   async function btnAdd() {
  //     const itemId = itemIdRef.current.value || null;
  //     const unit = unitRef.current.value || null;
  //     const totalQty = totalQtyRef.current.value || null;
  //     const costPrice = costPriceRef.current.value || null;
  // const  totalCostPrice = totalCostPriceRef.current.value || null;

  //     if (!itemId) {
  //       toast.error("Please Provide Item Name!");
  //       return;
  //     }

  //     if (!unit) {
  //       toast.error("Please Provide Unit!");
  //       return;
  //     }

  //     if (!totalQty) {
  //       toast.error("Please Provide Stock Quantity!");
  //       return;
  //     }

  //     if (!costPrice) {
  //       toast.error("Please Provide Stock Expired Date!");
  //       return;
  //     }
  //     if (!totalCostPrice) {
  //       toast.error("Please provide unitPrice!");
  //       return;
  //     }

  //     console.log('stock data => ', itemId, unit, totalQty, costPrice, totalCostPrice)

  //     try {
  //       toast.loading("Please wait...");
  //       const res = await addStockExpenses(itemId, unit, totalQty, costPrice, totalCostPrice);

  //       if (res.status == 200) {
  //         itemIdRef.current.value = null;
  //         unitRef.current.value = null;
  //         totalQtyRef.current.value = null;
  //         costPriceRef.current.value = null;
  //         totalCostPriceRef.current.value = null;

  //         if (APIURL) {
  //           await mutate(APIURL);
  //         }
  //         toast.dismiss();
  //         toast.success(res.data.message);
  //         document.getElementById("modal-add").close();
  //         onSuccess(itemId);
  //       }
  //     } catch (error) {
  //       const message = error?.response?.data?.message || "Something went wrong!";
  //       console.error(error);

  //       toast.dismiss();
  //       toast.error(message);
  //     }
  //   }

  // const getBatchData = async (orderId = null) => {
  //   const res = await getStockExpenseBatchesData({orderId});
  //   setBatchData(res?.data || [])
  //   console.log('res 1 => ', res)
  //   document.getElementById("modal-viewMore-2").showModal()
  // }

  const getMenuItemData = async (orderId) => {
    try {
      setSelectedOrderId(orderId);
      const res = await getOrderMenuItems({ orderId });
      setOrderMenuItemsData(res?.data || []);
      document.getElementById("modal-viewMore-1").showModal();
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  };

  const getMenuRawItemsData = async (orderId, recipeId) => {
    const res = await getOrderMenuRawItems({ orderId, recipeId });
    setMenuRawItemsData(res?.data || []);
    console.log("res 1 => ", res);
    document.getElementById("modal-viewMore-2").showModal();
  };

  const getItemData = async (orderId, recipeId) => {
    const res = await getStockExpenseBatchesData({ orderId, recipeId });
    setBatchDataGrid(res?.data || []);
    console.log("res 1 => ", res);
    document.getElementById("modal-viewMore-5").showModal();
  };

  const ExcelExport = async () => {
    const startDate = formattedDate(filterData.startDate);
    const endDate = formattedDate(filterData.endDate);

    exportcsv({ startDate, endDate });
    console.log("Export initiated with formatted dates:", startDate, endDate);
  };

  return (
    <div>
      <div>
        <Page className="px-8 py-6">
          <div className="flex items-center gap-6">
            <h3 className="text-3xl font-light"> Stock Expenses Details</h3>
          </div>

          <div className="flex items-center gap-6 mt-6 justify-between">
            <div className="flex items-center space-x-2 bg-white rounded-[20px] px-3 py-2 shadow-sm border border-black">
              <FaCalendarAlt className="h-5 w-5 text-gray-400" />
              <DatePicker
                selected={filterData?.startDate}
                name="startDate"
                onChange={(v) => handleDateChange(v, "startDate")}
                selectsStart
                // startDate={startDate}
                // endDate={endDate}
                dateFormat="d MMM, yyyy"
                className="text-sm text-gray-600 focus:outline-none"
                placeholderText="Start Date"
              />
              <span className="text-gray-400">-</span>
              <FaCalendarAlt className="h-5 w-5 text-gray-400" />
              <DatePicker
                selected={filterData?.endDate}
                name="endDate"
                onChange={(v) => handleDateChange(v, "endDate")}
                selectsEnd
                // startDate={startDate}
                // endDate={endDate}
                minDate={filterData?.startDate}
                dateFormat="d MMM, yyyy"
                className="text-sm text-gray-600 focus:outline-none"
                placeholderText="End Date"
              />
            </div>
            <div>
              <div className=" flex relative font-sans group sm:block">
                <button
                  className="w-[200px] h-[45px] flex items-center justify-center bg-restro-green/80 border rounded-[23px] px-4 p2 text-white  ml-6"
                  onClick={ExcelExport}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 w-full">
            <table className="w-full border overflow-x-auto">
              <thead>
                <tr>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-center  md:w-30">
                    Order ID
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-center  md:w-30">
                    Order Date
                  </th>

                  {/* <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Batch ID
                  </th> */}

                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-center md:w-30">
                    Order Quantitiy
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-center md:w-30">
                    View More
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData?.map((data, index) => {
                  return (
                    <tr key={"tr_" + index}>
                      <td className="px-3 py-2 text-center">
                        {data.order_id || "N/A"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {moment(data.order_date).format("YYYY-MM-DD")}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {data.order_quantity}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => getMenuItemData(data.order_id)}
                          className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 transition active:scale-95"
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

          {/* table two - 2 */}

          <dialog id="modal-viewMore-1" className="modal modal-middle">
            <div className="modal-box max-w-5xl">
              <h3 className="font-bold text-lg">Menu Items For order Id</h3>

              <div className="flex gap-4 w-full my-8"></div>

              <div className="mt-12 w-full">
                <table className="w-full border overflow-x-auto">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-28">
                        Menu Item Name
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-28">
                        Varient Name
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Price
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Quantity
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Addons
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Discount
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Tax Total
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderMenuItemsData?.map((d, index) => {
                      const data = d.items[0];
                      return (
                        <tr key={"tr_" + index}>
                          <td className="px-3 py-2 text-start">
                            {data.menu_item_name || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.varient_name || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">{data.price}</td>
                          <td className="px-3 py-2 text-start">
                            {data.quantity || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.addons || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.discount || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.tax_total || "N/A"}
                          </td>

                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() =>
                                getMenuRawItemsData(
                                  selectedOrderId,
                                  d.recipe_id
                                )
                              }
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
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

              <div className="modal-action">
                <form method="dialog">
                  {/*    close button in the modal */}
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                  >
                    Close
                  </button>
                </form>
              </div>
            </div>
          </dialog>

          {/* table three - 3  */}

          <dialog id="modal-viewMore-2" className="modal modal-middle">
            <div className="modal-box max-w-5xl">
              <h3 className="font-bold text-lg">Menu Raw Items</h3>

              <div className="flex gap-4 w-full my-8"></div>
              <div className="mt-12 w-full">
                <table className="w-full border overflow-x-auto">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                        Item Name
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-28">
                        Sale Unit
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Quantity
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuRawItemsData?.map((data, index) => {
                      return (
                        <tr key={"tr_" + index}>
                          <td className="px-3 py-2 text-start">
                            {data.name || "N/A"}
                          </td>

                          <td className="px-3 py-2 text-start">
                            {data.product_sale_unit || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.quantity || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() =>
                                getItemData(data.order_id, data.recipe_id)
                              }
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
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

              <div className="modal-action">
                <form method="dialog">
                  {/*    close button in the modal */}
                  <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                    Close
                  </button>
                </form>
              </div>
            </div>
          </dialog>

          {/* table four - 4  */}

          {/* <dialog
            id="modal-viewMore-1"
            className="modal modal-bottom sm:modal-middle"
          >
            <div className="modal-box">
              <h3 className="font-bold text-lg">
                View Stock Expenses Batch Wise
              </h3>

              <div className="flex gap-4 w-full my-8"></div>


              


              <div className="mt-12 w-full">
                <table className="w-full border overflow-x-auto">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                        Batch ID 
                      </th>                 

                     

                     
                       <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                     Quantity
                      </th>
                         <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                    Price (Total Cost)
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                     Item ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderIdtableData?.map((data, index) => {
                      return (
                        <tr key={"tr_" + index}>
                          <td className="px-3 py-2 text-start">{data.batchID}</td>
                          
                         
                          <td className="px-3 py-2 text-start">
                            {data.quantity}
                          </td>
                            <td className="px-3 py-2 text-start">
                            {data.price}
                          </td>
                           <td className="px-3 py-2 text-start">
                            {data.itemID}
                          </td>

                         
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/*    close button in the modal */}
          {/* <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                    Close
                  </button>
                  <button
                    onClick={() => {
                      btnAdd();
                    }}
                    className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </dialog>  */}

          {/* pagination  prev*/}
          {/* <div className="flex justify-end mt-8">
            <div className="join">
              <button
                onClick={btnPaginationFirstPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == 1,
                  }
                )}
              >
                <IconChevronsLeft stroke={iconStroke} />
              </button>
              <button
                onClick={btnPaginationPreviousPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == 1,
                  }
                )}
              >
                <IconChevronLeft stroke={iconStroke} />
              </button>
              <button className="join-item btn btn-sm bg-gray-100 text-gray-500">
                Page {currentPage}
              </button>
              <button
                onClick={btnPaginationNextPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == totalPages,
                  }
                )}
              >
                <IconChevronRight stroke={iconStroke} />
              </button>
              <button
                onClick={btnPaginationLastPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == totalPages,
                  }
                )}
              >
                <IconChevronsRight stroke={iconStroke} />
              </button>
            </div>
          </div>
          <div className="text-end mt-4">
            <p>
              Showing {tableData?.length} of {totalItems}
            </p>
          </div> */}
          {/* pagination  prev*/}

          {/* pagination */}

          <div className="flex justify-end mt-8">
            <div className="join">
              <button
                onClick={btnPaginationFirstPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  { "btn-disabled": pagination.currentPage == 1 }
                )}
              >
                <IconChevronsLeft stroke={iconStroke} />
              </button>
              <button
                onClick={btnPaginationPreviousPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  { "btn-disabled": pagination.currentPage == 1 }
                )}
              >
                <IconChevronLeft stroke={iconStroke} />
              </button>
              <button className="join-item btn btn-sm bg-gray-100 text-gray-500">
                Page {pagination.currentPage}
              </button>
              <button
                onClick={btnPaginationNextPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled":
                      pagination.currentPage == pagination.totalPages,
                  }
                )}
              >
                <IconChevronRight stroke={iconStroke} />
              </button>
              <button
                onClick={btnPaginationLastPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled":
                      pagination.currentPage == pagination.totalPages,
                  }
                )}
              >
                <IconChevronsRight stroke={iconStroke} />
              </button>
            </div>
          </div>
          <div className="text-end mt-4">
            <p>
              Showing {tableData?.length} of {pagination.totalItems}
            </p>
          </div>

          {/* pagination */}

          <dialog
            id="modal-viewMore"
            className="modal modal-bottom sm:modal-middle"
          >
            <div className="modal-box">
              <h3 className="font-bold text-lg">
                View Stock Expenses with Order ID
              </h3>

              <div className="flex gap-4 w-full my-8"></div>

              <div className="flex items-center text-black gap-2">
                <div className="flex items-center space-x-2 bg-white rounded-[20px] px-3 py-2 shadow-sm border border-black">
                  <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                  <DatePicker
                    selected={filterData?.startDate}
                    name="startDate"
                    onChange={(v) => handleDateChange(v, "startDate")}
                    selectsStart
                    // startDate={startDate}
                    // endDate={endDate}
                    dateFormat="d MMM, yyyy"
                    className="text-sm text-gray-600 focus:outline-none"
                    placeholderText="Start Date"
                  />
                  <span className="text-gray-400">-</span>
                  <DatePicker
                    selected={filterData?.endDate}
                    name="endDate"
                    onChange={(v) => handleDateChange(v, "endDate")}
                    selectsEnd
                    // startDate={startDate}
                    // endDate={endDate}
                    minDate={filterData?.startDate}
                    dateFormat="d MMM, yyyy"
                    className="text-sm text-gray-600 focus:outline-none"
                    placeholderText="End Date"
                  />
                </div>
              </div>

              <div className="mt-12 w-full">
                <table className="w-full border overflow-x-auto">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                        Order ID
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-96">
                        Order Date
                      </th>

                      {/* <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Batch ID
                  </th> */}

                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Order Quantitiy
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        View More
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData?.map((data, index) => {
                      return (
                        <tr key={"tr_" + index}>
                          <td className="px-3 py-2 text-start">
                            {data.order_id || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {moment(data.order_date).format("YYYY-MM-DD")}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.order_quantity || "N/A"}
                          </td>

                          <td className="px-3 py-2 text-start flex flex-wrap gap-2 items-center">
                            <button
                              onClick={() => getBatchData(data.order_id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
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

              <div className="modal-action">
                <form method="dialog">
                  {/*    close button in the modal */}
                  <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                    Close
                  </button>
                  <button
                    onClick={() => {
                      btnAdd();
                    }}
                    className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </dialog>

          {/* {itemNames?.length == 0 && (
            <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
              <p className="text-gray-400">No stock items Found!</p>
            </div>
          )} */}

          {/* {itemNames?.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {itemNames.map((itemData) => {
                const {
                  itemId,
                  addedQuantity,
                  expiredDate,
                  batchPrice,
                  created_at,
                  updated_at,
                } = itemData;

                return (
                  <div
                    key={itemCategory}
                    className="border border-restro-border-green-light rounded-2xl px-4 py-5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex w-12 h-12 rounded-full items-center justify-center bg-gray-100 text-gray-400">
                        <IconUser />
                      </div>
                      <div>
                        <p>{itemId}</p>
                        <p className="text-sm flex items-center gap-1 text-gray-500">
                          {" "}
                          {itemId}
                        </p>
                      </div>
                    </div>

                    {itemUnit && (
                      <p className="mt-4 text-sm flex flex-wrap items-center gap-1 text-gray-500 truncate ">
                        {" "}
                        {itemUnit}
                      </p>
                    )}
                    {batchPrice && (
                      <p className="text-sm flex items-center gap-1 text-gray-500">
                        {" "}
                        {batchPrice}
                      </p>
                    )}
                    {addedQuantity && (
                      <p className="text-sm flex items-center gap-1 text-gray-500">
                        {" "}
                        {addedQuantity}
                      </p>
                    )}
                    {expiredDate && (
                      <p className="text-sm flex items-center gap-1 text-gray-500">
                        {" "}
                        {expiredDate}
                      </p>
                    )}

                    <div className="mt-4 text-sm flex items-center gap-1 text-gray-500">
                      <IconCalendarPlus stroke={iconStroke} size={18} />{" "}
                      {new Date(created_at).toLocaleString()}
                    </div>
                    {updated_at && (
                      <div className="text-sm flex items-center gap-1 text-gray-500">
                        <IconCalendarTime stroke={iconStroke} size={18} />{" "}
                        {new Date(updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )} */}

          {/* ViewMore Button Model */}

          {/* View More Modal 2 */}

          <dialog id="modal-viewMore-5" className="modal modal-middle">
            <div className="modal-box max-w-5xl">
              <h3 className="font-bold text-lg">
                View Stock Expenses with Batch ID
              </h3>

              <div className="flex gap-4 w-full my-4"></div>
              <div className="mt-8 w-full">
                <table className="w-full border overflow-x-auto">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                        Batch ID
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-28">
                        Ingredient Name
                      </th>

                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Ingredient Quantity
                      </th>
                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Unit
                      </th>

                      <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                        Ingredient Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchDataGrid?.map((data, index) => {
                      return (
                        <tr key={index}>
                          <td className="px-3 py-2 text-start">
                            {data.batch_id || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.item_name || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.consumed_quantity || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.unit || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-start">
                            {data.total_cost || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button
                    onClick={() => setBatchData([])}
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
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </dialog>

          <dialog
            id="modal-delete"
            className="modal fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Overlay */}
            {/* <div className="absolute inset-0 bg-red-600 opacity-30"></div> */}

            {/* Modal Box */}
            <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-auto z-10">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Are you sure ?
                </h2>
                <p className="text-gray-500 font-bold">
                  This action is irreversible, <b>Are you sure?</b>
                </p>
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
                    This Item in the Stock will be <b>permanently deleted</b>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={() =>
                    document.getElementById("modal-delete").close()
                  }
                  className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-6 py-3 bg-gray-200 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    document.getElementById("modal-delete").close();
                    btnDelete(tenantIdForDelete);
                  }}
                  className="rounded-lg hover:bg-red-500 transition active:scale-95 hover:shadow-lg px-6 py-3 bg-red-700 text-white"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </dialog>

          <dialog
            id="modal-edit"
            className="modal modal-bottom sm:modal-middle"
          >
            <div className="modal-box">
              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <div>
                    <div className="flex-1">
                      <label
                        htmlFor="stockQty"
                        className="mb-1 block text-gray-500 text-sm"
                      >
                        {" "}
                        Stock Quantity
                      </label>
                      <input
                        // ref={unitPriceRef}
                        type="text"
                        name="stockQty"
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex-1">
                      <label
                        htmlFor="adjustmentReason"
                        className="mb-1 block text-gray-500 text-sm"
                      >
                        {" "}
                        Adjustment Reason
                      </label>
                      <input
                        // ref={unitPriceRef}
                        type="text"
                        name="adjustmentReason"
                        className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      btnClose();
                    }}
                    className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                  >
                    Close
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </Page>
      </div>
    </div>
  );
}

export default StockExpensesPage;
