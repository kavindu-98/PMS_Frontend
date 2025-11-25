/** @format */

import { iconStroke } from "../../config/config";
import React, { useEffect, useRef, useState } from "react";
import Page from "../../components/Page";
// import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconAlertTriangleFilled,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronLeft,
  IconX,
  IconFilterFilled,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import {
  addStock,
  deleteStock,
  editStock,
  useStocks,
} from "../../controllers/stock.controller";
import { clsx } from "clsx";
import { useCategory } from "../../controllers/category.controller";
import { useIngredientsItems } from "../../controllers/ingredient_item.controller";
import "react-datepicker/dist/react-datepicker.css";
import { getUserDetailsInLocalStorage } from "../../helpers/UserDetails";
import Papa from "papaparse";
import { useStores } from "../../controllers/store.controller";

function StockAddPage() {
  const user = getUserDetailsInLocalStorage();

  const { username: adjustmentBy } = user;
  const [categoryList, setCategoryList] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [itemList, setItemList] = useState([]);

  const [isHousekeepingEnabled, setIsHousekeepingEnabled] = useState("");

  const [tableData, settableData] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [filterData, setFilterData] = useState({
    currentPage: 1,
    categoryId: "",
    storeId: "",
    storeName: "",
    itemName: "",
  });

  const [selectedStore, setSelectedStore] = useState(null);
  const categoryResult = useCategory();
  useEffect(() => {
    if (categoryResult?.data?.length) {
      setCategoryList(categoryResult?.data);
    }
  }, [categoryResult]);

  const itemResult = useIngredientsItems({
    perPage: 1000,
    isHouseKeeping: isHousekeepingEnabled || false,
  });
  useEffect(() => {
    setItemList(itemResult?.data?.data || []);
  }, [itemResult]);

  const { APIURL, data, error, isLoading } = useStocks({
    page: filterData.currentPage,
    stores_id: filterData.storeId,
    categoryId: filterData.categoryId,
    itemName: filterData?.itemName,
  });

  useEffect(() => {
    settableData(data?.data || []);
  }, [data]);

  const {
    page: currentPage = null,
    totalPages = null,
    totalItems = null,
  } = data?.pagination || {};

  const {
    data: stores,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useStores();

  // pagination
  const btnPaginationFirstPage = () => {
    setFilterData((ps) => ({ ...ps, currentPage: 1 }));
  };
  const btnPaginationLastPage = () => {
    setFilterData((ps) => ({ ...ps, currentPage: totalPages }));
  };
  const btnPaginationNextPage = () => {
    if (currentPage == totalPages) {
      return;
    }
    setFilterData((ps) => ({ ...ps, currentPage: currentPage + 1 }));
  };
  const btnPaginationPreviousPage = () => {
    if (currentPage == 1) {
      return;
    }
    setFilterData((ps) => ({ ...ps, currentPage: currentPage - 1 }));
  };
  // pagination

  const itemNames = null;
  const itemIdRef = useRef();
  const expiredDateRef = useRef();
  const addStoreIdRef = useRef();
  const batchPriceRef = useRef();
  const addedQuantityRef = useRef();
  const stockQuantityRef = useRef();
  const storeIdRef = useRef();
  const adjustmentReasonRef = useRef();
  const searchRef = useRef();
  const searchItemRef = useRef();
  const batchIdRef = useRef();
  const old_quantityRef = useRef();
  const new_quantityRef = useRef();
  const unitPriceRef = useRef();

  const handleSelectCategory = async () => {
    searchItemRef.current.value = "";
    const searchCategoryVal = searchRef.current.value;

    if (!new String(searchCategoryVal).trim()) {
      return;
    }

    setFilterData((ps) => ({
      ...ps,
      currentPage: 1,
      categoryId: searchCategoryVal,
      itemName: null,
    }));
  };

  const handleSelectStore = async () => {
    const selectedId = storeIdRef.current.value;

    if (selectedId === "") {
      setSelectedStore(""); // Set to an empty string when no store is selected
    } else {
      const storeObject = stores.find(
        (store) => store.id.toString() === selectedId
      ); // Find full store object
      setSelectedStore(storeObject.storeName);
    }

    setFilterData((ps) => ({
      ...ps,
      currentPage: 1,
      storeId: selectedId,
      itemName: null,
    }));

    // useStocks()
    await mutate(APIURL);
  };

  const btnClearSearch = () => {
    searchRef.current.value = "";
    storeIdRef.current.value = "";
    setFilterData((ps) => ({
      ...ps,
      categoryId: null,
      storeId: null,
      itemName: null,
      currentPage: 1,
    }));
  };

  const btnSearchItemName = () => {
    searchRef.current.value = "";
    const searchQueryItmName = searchItemRef.current.value;
    if (!new String(searchQueryItmName).trim()) {
      return;
    }

    setFilterData((ps) => ({
      ...ps,
      itemName: searchQueryItmName,
      categoryId: null,
      currentPage: 1,
    }));
  };

  const btnClearSearchName = () => {
    searchItemRef.current.value = "";
    setFilterData((ps) => ({
      ...ps,
      itemName: null,
      categoryId: null,
      currentPage: 1,
    }));
  };

  async function btnAdd() {
    const itemId = itemIdRef.current.value || null;
    const addedQuantity = addedQuantityRef.current.value || null;
    const batchPrice = batchPriceRef.current.value || null;
    const expiredDate = expiredDateRef.current.value || null;
    const storeId = addStoreIdRef.current.value || null;
    const addBy = adjustmentBy || null;

    if (!itemId) {
      toast.error("Please Provide Item Name!");
      return;
    }
    if (!addedQuantity) {
      toast.error("Please Provide Stock Quantity!");
      return;
    }
    if (!batchPrice) {
      toast.error("Please provide batchPrice!");
      return;
    }
    if (!expiredDate) {
      toast.error("Please Provide Stock Expired Date!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addStock({
        itemId,
        addedQuantity,
        expiredDate,
        batchPrice,
        storeId,
        addBy,
      });

      if (res.status == 200) {
        itemIdRef.current.value = null;
        addedQuantityRef.current.value = null;
        expiredDateRef.current.value = null;
        addStoreIdRef.current.value = null;
        batchPriceRef.current.value = null;

        if (APIURL) {
          await mutate(APIURL);
        }
        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-add").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  async function btnEdit() {
    const batch_id = batchIdRef.current || null;
    const old_quantity = old_quantityRef.current.value || null;
    const new_quantity = new_quantityRef.current.value || null;
    const reason = adjustmentReasonRef.current.value || null;

    console.log(
      "data => ",
      batch_id,
      old_quantity,
      new_quantity,
      reason,
      adjustmentBy
    );

    if (!new_quantity) {
      toast.error("Please Provide newly added quantity");
      return;
    }

    if (!reason) {
      toast.error("please provide adjustment reason");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await editStock({
        batch_id,
        old_quantity,
        new_quantity,
        reason,
        adjustmentBy,
      });

      console.log("res => ", res);

      if (res.status == 200) {
        new_quantityRef.current.value = null;
        adjustmentReasonRef.current.value = null;

        if (APIURL) {
          await mutate(APIURL);
        }
        // viewBatchData(batch_id)
        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-edit").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  const viewBatchData = (itemId) => {
    // const itemData = [...tableData];
    // const batchDetails =
    //   itemData?.find((d) => d.item_id === itemId)?.Batches || [];
    //   console.log('batchDetails => ', itemData, batchDetails)
    // setBatchData(batchDetails);
    // document.getElementById("modal-viewMore").showModal();
  };

  useEffect(() => {
    if (selectedItemId) {
      console.log("selectedItemId => ", selectedItemId);
      const itemData = [...tableData];
      const batchDetails =
        itemData?.find((d) => d.item_id === selectedItemId)?.Batches || [];
      console.log("batchDetails => ", itemData, batchDetails);
      setBatchData(batchDetails);
    }
  }, [selectedItemId, tableData]);

  const ExcelExport = () => {
    // Log the input to debug issues
    console.log("Exporting Data: ", tableData);
    // Validate the input data
    if (!Array.isArray(tableData) || tableData.length === 0) {
      alert("No data available for export.");
      return;
    }

    const batches = tableData?.map((d) => d.Batches).flat();

    // Map table data to the desired CSV structure
    const csvData = batches?.map((item) => ({
      "Batch Id": item.batch_id,
      "Item Name": item.item_name || "N/A",
      "Item Qty": item.current_quantity || "N/A",
      "Expire Date": item.expired_date || "N/A",
      "Unit Price (Batch Price)": item.batch_price || "N/A",
    }));

    // Convert data to CSV format
    const csv = Papa.unparse(csvData);

    // Create and download the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Stock.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    ExcelExport(tableData, batchData);
  };

  return (
    <div>
      <div>
        <Page className="px-8 py-6">
          <div className="flex items-center gap-6">
            <h3 className="text-3xl font-light"> Stock Details </h3>
            <button
              onClick={() => document.getElementById("modal-add").showModal()}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
            >
              <IconPlus size={22} stroke={iconStroke} /> Add New Stock
            </button>
          </div>

          <div className="flex justify-between mt-6">
            <div className="flex items-center gap-6 ">
              <div className="flex gap-2">
                <div className="flex gap-2">
                  {/* Dropdown for Selecting Category */}
                  <div className="flex items-center px-4 py-1 bg-gray-100 rounded-lg">
                    <select
                      ref={storeIdRef}
                      name="from-store"
                      className="block w-full bg-transparent outline-none placeholder:text-gray-400"
                      placeholder="Select a Store"
                      onChange={handleSelectStore}
                    >
                      <option value="">Select a Store</option>

                      {stores && stores?.length > 0 ? (
                        stores.map((store, index) => (
                          <option key={index} value={store.id}>
                            {store.storeName} - {store.storeLocation}
                          </option>
                        ))
                      ) : (
                        <option disabled>No stores available</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-2">
                  {/* Dropdown for Selecting Category */}
                  <div className="flex items-center px-4 py-1 bg-gray-100 rounded-lg">
                    <select
                      ref={searchRef}
                      defaultValue={filterData.categoryId || ""}
                      onChange={handleSelectCategory}
                      className="block w-full bg-transparent outline-none placeholder:text-gray-400"
                    >
                      <option value="" disabled>
                        Select a Category
                      </option>

                      {/* Dynamically Map item_name from tableData */}
                      {categoryList?.map((category, i) => (
                        <option key={i} value={category.id}>
                          {category.item_category_name}
                        </option>
                      ))}
                    </select>

                    {filterData.categoryId && (
                      <button
                        onClick={btnClearSearch}
                        className="ml-2 text-gray-400"
                      >
                        <IconX stroke={iconStroke} size={18} />
                      </button>
                    )}
                  </div>
                </div>
                {/* 
                <button
                  onClick={btnSearch}
                  className="px-4 py-1 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
                >
                  Search
                </button> */}
              </div>

              <div className="flex gap-2">
                <div className="flex items-center px-2 py-1 bg-gray-100 rounded-lg">
                  <input
                    ref={searchItemRef}
                    type="text"
                    placeholder="Search Stock Item by Name"
                    className="block bg-transparent outline-none placeholder:text-gray-400"
                  />

                  {filterData.itemName && (
                    <button
                      onClick={btnClearSearchName}
                      className="text-gray-400"
                    >
                      <IconX stroke={iconStroke} size={18} />
                    </button>
                  )}
                </div>

                <button
                  onClick={btnSearchItemName}
                  className="px-4 py-1 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
                >
                  Search
                </button>
              </div>
            </div>

            <div>
              <div className="relative flex font-sans group sm:block">
                <button
                  className="px-4 py-1 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
                  onClick={ExcelExport}
                >
                  📄 Export CSV
                </button>
              </div>
            </div>
          </div>
          <div className="w-full mt-8">
            <h3>
              Showing Stock Selected "{selectedStore ? selectedStore : "All"}"
              Store
            </h3>
            <table className="w-full overflow-x-auto border mt-2">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-40">
                    Item Name
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                    Stock Alert
                  </th>

                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                    Full Stock Qty
                  </th>

                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                    Product Sale Unit
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                    Product Purchase Unit
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                    View More
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData?.length > 0 ? (
                  tableData.map((data, index) => {
                    return (
                      <tr key={"tr_" + index}>
                        <td className="px-3 py-2 text-start">
                          {data.item_name}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.stock_alert}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.full_stock_quantity}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.product_sale_unit}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.product_purchase_unit}
                        </td>

                        <td className="flex flex-wrap items-center gap-2 px-3 py-2 text-start">
                          <button
                            onClick={() => {
                              setSelectedItemId(data?.item_id);
                              document
                                .getElementById("modal-viewMore")
                                .showModal();
                            }}
                            className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                          >
                            <IconChevronRight stroke={iconStroke} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 py-2 text-center">
                      No stocks available in this store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex justify-end mt-8">
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
              <button className="text-gray-500 bg-gray-100 join-item btn btn-sm">
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

          <div className="mt-4 text-end">
            <p>
              Showing {tableData?.length} of {totalItems}
            </p>
          </div>
          {/* pagination */}

          <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box">
              <h3 className="text-lg font-bold">Add New Stock</h3>

              <div className="flex-1 my-4">
                <label
                  htmlFor="enableHousekeeping"
                  className="block mb-1 text-sm text-gray-500"
                >
                  {" "}
                  Is Housekeeping ?
                </label>
                <label className="relative inline-flex items-center cursor-pointer no-drag">
                  <input
                    checked={isHousekeepingEnabled}
                    type="checkbox"
                    name="enableHousekeeping"
                    id="enableHousekeeping"
                    onChange={(e) => setIsHousekeepingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-restro-green peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
                </label>
              </div>

              <div className="flex-1">
                <label
                  htmlFor="item_name"
                  className="block mb-1 text-sm text-gray-500"
                >
                  Item Name
                </label>
                <select
                  ref={itemIdRef}
                  name="item_name"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  placeholder="Select Tax Type"
                >
                  <option value="" hidden>
                    Select Item Name
                  </option>
                  {itemList?.map((item, i) => (
                    <option key={i} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex-1 my-4">
                  <label
                    htmlFor="stockQty"
                    className="block mb-1 text-sm text-gray-500"
                  >
                    {" "}
                    Add Stock Qty
                  </label>
                  <input
                    ref={addedQuantityRef}
                    type="text"
                    name="stockQty"
                    className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    placeholder="Enter Stock Qty"
                  />
                </div>
              </div>

              <div>
                <div className="flex-1 my-4">
                  <label
                    htmlFor="batchPrice"
                    className="block mb-1 text-sm text-gray-500"
                  >
                    {" "}
                    Batch Price
                  </label>
                  <input
                    ref={batchPriceRef}
                    type="text"
                    name="batchPrice"
                    className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    placeholder="Enter Batch Price"
                  />
                </div>
              </div>

              <div>
                <div className="flex-1 my-4">
                  <label
                    htmlFor="itemUnit"
                    className="block mb-1 text-sm text-gray-500"
                  >
                    {" "}
                    Expired Date
                  </label>
                  <input
                    ref={expiredDateRef}
                    type="date"
                    name="itemUnit"
                    className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    placeholder="Enter Expired Date"
                  />
                </div>
              </div>

              <div>
                <div className="flex-1 my-4">
                  <label
                    htmlFor="itemUnit"
                    className="block mb-1 text-sm text-gray-500"
                  >
                    {" "}
                    Added Store
                  </label>
                  <select
                    ref={addStoreIdRef}
                    name="add-store"
                    className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    placeholder="Select Store"
                  >
                    <option value="" hidden>
                      Select Store
                    </option>
                    {stores && stores?.length > 0 ? (
                      stores.map((store, index) => (
                        <option key={index} value={store.id}>
                          {store.storeName} - {store.storeLocation}
                        </option>
                      ))
                    ) : (
                      <option disabled>No stores available</option>
                    )}
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
                      btnAdd();
                    }}
                    className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </dialog>

          {itemNames?.length > 0 && (
            <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {itemNames.map((itemData) => {
                const {
                  itemId,
                  addedQuantity,
                  // expiredDate,
                  batchPrice,
                  created_at,
                  updated_at,
                } = itemData;

                return (
                  <div
                    key={itemCategory}
                    className="px-4 py-5 border border-restro-border-green-light rounded-2xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                        <IconUser />
                      </div>
                      <div>
                        <p>{itemId}</p>
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          {" "}
                          {itemId}
                        </p>
                      </div>
                    </div>

                    {itemUnit && (
                      <p className="flex flex-wrap items-center gap-1 mt-4 text-sm text-gray-500 truncate ">
                        {" "}
                        {itemUnit}
                      </p>
                    )}
                    {batchPrice && (
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        {" "}
                        {batchPrice}
                      </p>
                    )}
                    {addedQuantity && (
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        {" "}
                        {addedQuantity}
                      </p>
                    )}
                    {expiredDate && (
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        {" "}
                        {expiredDate}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-4 text-sm text-gray-500">
                      <IconCalendarPlus stroke={iconStroke} size={18} />{" "}
                      {new Date(created_at).toLocaleString()}
                    </div>
                    {updated_at && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <IconCalendarTime stroke={iconStroke} size={18} />{" "}
                        {new Date(updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ViewMore Button Model */}

          <dialog
            id="modal-viewMore"
            // className="modal modal-bottom sm:modal-middle"
            className="modal modal-middle "
          >
            <div className="max-w-5xl rounded-lg modal-box">
              <h3 className="text-lg font-bold">
                View Stock Items with Batch ID
              </h3>

              <div className="flex w-full gap-4 my-4"></div>
              <div className="w-full mt-8">
                <table className="w-full overflow-x-auto border">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                        Batch ID
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-40">
                        Item Name
                      </th>

                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                        Item Qty
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                        Expire Date
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                        Store Name
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                        Unit Price (Batch Price)
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchData?.map((data, index) => (
                      <tr key={index}>
                        {/* <td className="px-3 py-2 text-start">{index + 1}</td> */}

                        <td className="px-3 py-2 text-start">
                          {data.batch_id}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.item_name}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.current_quantity}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.expired_date}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.storeName}
                        </td>
                        <td className="px-3 py-2 text-start">
                          {data.batch_price}
                        </td>

                        <td className="flex flex-wrap items-center gap-2 px-3 py-2 text-start">
                          <div className="flex">
                            <button
                              onClick={() => {
                                batchIdRef.current = data.batch_id;
                                old_quantityRef.current = data.current_quantity;
                                document
                                  .getElementById("modal-edit")
                                  .showModal();
                              }}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                            >
                              <IconPencil stroke={iconStroke} />
                            </button>
                            <button
                              onClick={() => {
                                var deleteModal =
                                  document.getElementById("modal-delete");
                                deleteModal.setAttribute(
                                  "data-deleteId",
                                  data.batch_id
                                );
                                deleteModal.showModal();
                              }}
                              className="flex items-center justify-center w-8 h-8 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                            >
                              <IconTrash stroke={iconStroke} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
                  >
                    Close
                  </button>
                </form>
              </div>
            </div>

            <div className="flex items-center my-6 "></div>
          </dialog>

          <dialog
            id="modal-delete"
            className="fixed inset-0 z-50 flex items-center justify-center modal"
          >
            {/* Overlay */}
            {/* <div className="absolute inset-0 bg-red-600 opacity-30"></div> */}

            {/* Modal Box */}
            <div className="relative z-10 w-full max-w-lg p-6 mx-auto bg-white rounded-lg shadow-lg">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Are you sure ?
                </h2>
                <p className="font-bold text-gray-500">
                  This action is irreversible, <b>Are you sure?</b>
                </p>
              </div>

              <div className="mt-4 text-center">
                <div className="p-4 mt-2 text-left bg-red-100 rounded-lg">
                  <div className="flex items-center">
                    <IconAlertTriangleFilled
                      className="mr-2 text-red-600"
                      size={24}
                    />
                    <p className="text-lg font-bold text-red-700">Warning</p>
                  </div>
                  <p className="mt-1 text-sm text-red-700">
                    This Item in the Stock will be <b>permanently deleted</b>
                  </p>
                </div>
              </div>

              <div className="flex justify-center mt-4 space-x-4">
                <button
                  onClick={() =>
                    document.getElementById("modal-delete").close()
                  }
                  className="px-6 py-3 text-gray-600 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const deleteModal = document.getElementById("modal-delete");
                    const deleteRowId =
                      deleteModal.getAttribute("data-deleteId");
                    console.log("deleteRowId => ", deleteRowId);
                    await deleteStock({ stockId: deleteRowId, adjustmentBy });
                    if (APIURL) {
                      await mutate(APIURL);
                    }
                    deleteModal.close();
                  }}
                  className="px-6 py-3 text-white transition bg-red-700 rounded-lg hover:bg-red-500 active:scale-95 hover:shadow-lg"
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
              <h3 className="text-lg font-bold">Edit Stock Items</h3>

              <div className="mt-4">
                <label
                  htmlFor="stockQty"
                  className="block mb-1 text-sm text-gray-500"
                >
                  {" "}
                  Stock Quantity
                </label>
                <input
                  ref={new_quantityRef}
                  type="number"
                  name="stockQty"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="adjustmentReason"
                  className="block mb-1 text-sm text-gray-500"
                >
                  {" "}
                  Adjustment Reason
                </label>
                <textarea
                  ref={adjustmentReasonRef}
                  type="text"
                  name="adjustmentReason"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                />
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                    Close
                  </button>
                  <button
                    onClick={() => {
                      btnEdit();
                    }}
                    className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
                  >
                    Save
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

export default StockAddPage;
