/** @format */

import React, { useContext, useEffect, useState, useRef } from "react";
import Page from "../components/Page";
import { iconStroke } from "../config/config";
import {
  IconArmchair,
  IconBoxSeam,
  IconCheck,
  IconChecks,
  IconClock,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import {
  getHousekeepingOrders,
  updateHousekeepingStatus,
  addHousekeepingItemReq,
  addReturnHousekeepingItemReq,
} from "../controllers/housekeepers.controller";
import { useStores } from "../controllers/store.controller";
import { toast } from "react-hot-toast";
import { SocketContext } from "../contexts/SocketContext";
import { initSocket } from "../utils/socket";
import { textToSpeech } from "../utils/textToSpeech";
import { useIngredientsItems } from "../controllers/ingredient_item.controller";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
export default function HousekeepingServicePage() {
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

  const [selectedStatuses, setSelectedStatuses] = useState({});

  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const requestItemRef = useRef(null);
  const requestQuantityRef = useRef(null);

  const addStoreIdRef = useRef(null);
  const returnItemRef = useRef(null);
  const returnQuantityRef = useRef(null);
  const [ingredients, setIngredients] = useState([]);

  const [selectedServiceID, setSelectedServiceID] = useState([]);

  const [state, setState] = useState({
    HousekeepingTasks: [],
    isBar: "false",
    isRoomService: "false",
    isLoading: true,
  });

  const { data: IngredientsItems } = useIngredientsItems({
    page: state.spage,
    perPage: 100,
    isHouseKeeping: true,
  });

  const {
    data: stores,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useStores();

  useEffect(() => {
    _init();
    _initSocket();
  }, []);

  const { HousekeepingTasks, isLoading } = state;

  const _init = async () => {
    try {
      const res = await getHousekeepingOrders();

      if (res.status == 200) {
        const orders = res?.data || [];

        setState({
          ...state,
          HousekeepingTasks: orders || [],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error loading orders! Please try later!");

      setState({
        ...state,
        isLoading: false,
      });
    }
  };

  const _initSocket = () => {
    if (isSocketConnected) {
      socket.emit("authenticate", user.tenant_id);
      socket.on("new_order", (payload) => {
        console.log(payload);
        btnRefresh();
      });

      socket.on("order_update", () => {
        console.log("Order update");
        btnRefresh();
      });
    } else {
      initSocket();
      socket.emit("authenticate", user.tenant_id);
      socket.on("new_order", (payload) => {
        btnRefresh();
      });

      socket.on("order_update", () => {
        console.log("Order update");
        btnRefresh();
      });
    }
  };

  async function btnRefresh() {
    try {
      toast.loading("Please wait...");
      const res = await getHousekeepingOrders();

      if (res.status == 200) {
        toast.dismiss();
        const orders = res?.data || [];

        setState({
          ...state,
          HousekeepingTasks: orders || [],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error loading orders! Please try later!");

      setState({
        ...state,
        isLoading: false,
      });
    }
  }

  const removeSelectedItem = (raw_item_id) => {
    setIngredients((prev) =>
      prev.filter((item) => item.raw_item_id !== raw_item_id)
    );
  };

  const handleStatusChange = (e, id) => {
    const newStatus = e.target.value;

    // Update only the selected task status
    setSelectedStatuses((prev) => ({
      ...prev,
      [id]: newStatus,
    }));

    btnStartPreparingHousekeepingItem(id, newStatus);
  };

  // Helper function to get the status color
  const getStatusColor = (status) => {
    const selected = statusValue.find((s) => s.key === status);
    return selected ? selected.color : "";
  };

  // Helper function to get the color class based on the selected status
  const btnStartPreparingHousekeepingItem = async (id, selectedStatus) => {
    try {
      toast.loading("Please wait...");

      // Send "status" as type
      const res = await updateHousekeepingStatus(id, "status", selectedStatus);
      toast.dismiss();

      if (res.status == 200) {
        await btnRefresh();
        toast.success(res.data.message);
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

  async function btnRequestItem() {
    try {
      toast.loading("Please wait...");

      console.log("ingredients", ingredients);

      const newItems = ingredients?.map(({ raw_item_id, quantity }) => ({
        item_id: Number(raw_item_id),
        qty: Number(quantity),
      }));

      console.log("newItems", newItems);

      const res = await addHousekeepingItemReq(
        selectedServiceID,
        user.username,
        newItems
      );

      if (res.status === 200 || res.status === 201) {
        toast.dismiss();
        toast.success(res.data.message);
        await btnRefresh();
        resetItems();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  async function btnReturnItem() {
    try {
      toast.loading("Please wait...");

      console.log("ingredients", ingredients);

      const newItems = ingredients?.map(({ raw_item_id, quantity }) => ({
        item_id: Number(raw_item_id),
        qty: Number(quantity),
      }));
      const store_id = addStoreIdRef.current.value;

      console.log("newItems", newItems);
      const res = await addReturnHousekeepingItemReq(
        store_id,
        user.username,
        newItems
      );

      if (res.status === 200 || res.status === 201) {
        toast.dismiss();
        toast.success(res.data.message);
        await btnRefresh();
        resetItems();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  const btnAddHousekeepingItem = (type) => {
    let selectedItem = null;
    let quantity = null;

    // Dynamically set selectedItem and quantity based on the type
    if (type === "request") {
      selectedItem = requestItemRef.current.value;
      quantity = requestQuantityRef.current.value;
    } else if (type === "return") {
      selectedItem = returnItemRef.current.value;
      quantity = returnQuantityRef.current.value;
    }

    if (!selectedItem) {
      toast.error("Please provide Request Item!");
      return;
    }
    if (quantity < 0) {
      toast.error("Please provide valid quantity!");
      return;
    }

    const itemName = IngredientsItems?.data.find(
      (item) => item.id === Number(selectedItem)
    )?.name;
    const itemUnit = IngredientsItems?.data.find(
      (item) => item.id === Number(selectedItem)
    )?.product_sale_unit;

    // Add the new ingredient
    setIngredients((prev) => {
      if (prev.some((item) => item.raw_item_id === selectedItem)) {
        toast.error("Item already added!");
        return prev;
      }
      return [
        ...prev,
        { raw_item_id: selectedItem, name: itemName, unit: itemUnit, quantity },
      ];
    });

    // Clear inputs based on the type
    if (type === "request") {
      requestItemRef.current.value = "";
      requestQuantityRef.current.value = "";
    } else if (type === "return") {
      returnItemRef.current.value = "";
      returnQuantityRef.current.value = "";
    }
  };

  const resetItems = () => {
    setIngredients([]);
    setSelectedServiceID("");
    requestItemRef.current.value = "";
    requestQuantityRef.current.value = null;
    returnItemRef.current.value = "";
    returnQuantityRef.current.value = null;
    addStoreIdRef.current.value = "";
  };

  return (
    <Page>
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Housekeeping</h3>
        <button
          onClick={btnRefresh}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconRefresh size={22} stroke={iconStroke} /> Refresh
        </button>
      </div>

      {isLoading && <p>Please wait...</p>}

      {HousekeepingTasks?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/kitchen.svg"
            alt="no orders"
            className="w-full md:w-60"
          />
          <p className="text-gray-400">No Assigned Housekeeping Tasks!</p>
        </div>
      )}

      {HousekeepingTasks?.data?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {HousekeepingTasks.data.map((housekeeping, index) => {
            const {
              id,
              room_no,
              task_date,
              status,
              inspection_id,
              inspection_status,
              priority,
              cleaning_start_time,
              cleaning_end_time,
              tenant_id,
            } = housekeeping;

            // Convert to 12-hour format with AM/PM
            const formatTime = (time) => {
              const [hours, minutes] = time.split(":");
              const date = new Date();
              date.setHours(hours, minutes);
              return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
            };

            return (
              <div
                key={index}
                className="flex flex-col px-4 py-5 border border-restro-border-green-light rounded-2xl"
              >
                {/* Room and Task Info */}
                <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between">
                  <div>
                    <p className="font-bold">Room No: {room_no}</p>
                    <p className="text-sm">
                      Task Date: {new Date(task_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold">Priority: {priority}</p>
                  </div>
                </div>

                {/* Cleaning Time */}
                <div className="mt-4">
                  <p>Start Time: {formatTime(cleaning_start_time)}</p>
                  <p>End Time: {formatTime(cleaning_end_time)}</p>
                </div>

                {/* Inspection Details */}
                <div className="mt-4">
                  <p>Inspection By: {inspection_id}</p>
                  <p>Inspection Status: {inspection_status}</p>
                </div>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setSelectedServiceID(id);
                      document.getElementById("modal-item-request").showModal();
                    }}
                    className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
                  >
                    Item Request
                  </button>
                  <button
                    onClick={() => {
                      setSelectedServiceID(id);
                      document.getElementById("modal-item-return").showModal();
                    }}
                    className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
                  >
                    Item Return
                  </button>
                </div>

                {/* Actions */}
                <select
                  name="from-store"
                  className={`select select-sm select-bordered w-full mt-4 ${getStatusColor(
                    selectedStatuses[id] || status
                  )}`}
                  value={selectedStatuses[id] || status}
                  onChange={(e) => handleStatusChange(e, id)}
                >
                  {statusValue.map((statusOption, index) => (
                    <option
                      key={index}
                      value={statusOption.key}
                      className={statusOption.color}
                    >
                      {statusOption.value}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {/* housekeeping item request*/}
      <dialog
        id="modal-item-request"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Housekeeping Item Request</h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={requestItemRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={requestQuantityRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddHousekeepingItem("request")}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeSelectedItem(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetItems}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnRequestItem(selectedServiceID);
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Request
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* housekeeping item request*/}

      {/* housekeeping item return*/}
      <dialog
        id="modal-item-return"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Housekeeping Item Return</h3>

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

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={returnItemRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={returnQuantityRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddHousekeepingItem("return")}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeSelectedItem(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetItems}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnReturnItem(selectedServiceID);
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Return
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* housekeeping item return*/}
    </Page>
  );
}
