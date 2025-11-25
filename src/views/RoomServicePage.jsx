/** @format */

import React, { useContext, useEffect, useState } from "react";
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
  getKitchenOrders,
  updateKitchenOrderItemStatus,
  useKitchenOrders,
} from "../controllers/kitchen.controller";
import { toast } from "react-hot-toast";
import { SocketContext } from "../contexts/SocketContext";
import { initSocket } from "../utils/socket";
import { textToSpeech } from "../utils/textToSpeech";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
export default function RoomServicePage() {
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const [state, setState] = useState({
    kitchenOrders: [],
    isBar: "false",
    isRoomService: "true",
    isLoading: true,
  });

  useEffect(() => {
    _init();
    _initSocket();
  }, []);

  const { kitchenOrders, isLoading } = state;
  console.log("Bar orders", kitchenOrders);

  const _init = async () => {
    try {
      const res = await getKitchenOrders(
        state.isBar,
        state.isRoomService,
        user.username
      );

      if (res.status == 200) {
        const orders = res?.data || [];

        setState({
          ...state,
          kitchenOrders: orders || [],
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
    const audio = new Audio("/new_order_sound.mp3");
    if (isSocketConnected) {
      socket.emit("authenticate", user.tenant_id);
      socket.on("new_order", (payload) => {
        console.log(payload);
        // textToSpeech(`New order received, token number: ${payload}`)
        audio.play();
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
        console.log(payload);
        // textToSpeech(`New order received, token number: ${payload}`)
        audio.play();
        btnRefresh();
      });

      socket.on("order_update", () => {
        console.log("Order update");
        btnRefresh();
      });
    }
  };

  const sendOrderUpdateEvent = () => {
    const user = getUserDetailsInLocalStorage();

    if (isSocketConnected) {
      socket.emit("order_update_backend", {}, user.tenant_id);
    } else {
      // Handle disconnected state (optional)
      initSocket();
      socket.emit("order_update_backend", {}, user.tenant_id);
    }
  };

  async function btnRefresh() {
    try {
      toast.loading("Please wait...");
      const res = await getKitchenOrders(
        state.isBar,
        state.isRoomService,
        user.username
      );

      if (res.status == 200) {
        toast.dismiss();
        const orders = res?.data || [];

        setState({
          ...state,
          kitchenOrders: orders || [],
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

  const btnStartPreparingOrderItem = async (orderItemId) => {
    try {
      toast.loading("Please wait...");
      const res = await updateKitchenOrderItemStatus(orderItemId, "preparing");
      toast.dismiss();
      if (res.status == 200) {
        await btnRefresh();
        sendOrderUpdateEvent();
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
  const btnCompletePreparingOrderItem = async (orderItemId) => {
    try {
      toast.loading("Please wait...");
      const res = await updateKitchenOrderItemStatus(orderItemId, "completed");
      toast.dismiss();
      if (res.status == 200) {
        sendOrderUpdateEvent();
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

  return (
    <Page>
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Room Service</h3>
        <button
          onClick={btnRefresh}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconRefresh size={22} stroke={iconStroke} /> Refresh
        </button>
      </div>

      {isLoading && <p>Please wait...</p>}

      {kitchenOrders?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/kitchen.svg"
            alt="no orders"
            className="w-full md:w-60"
          />
          <p className="text-gray-400">No Orders Pending!</p>
        </div>
      )}

      {kitchenOrders?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {kitchenOrders.map((order, index) => {
            const {
              id,
              date,
              delivery_type,
              customer_type,
              customer_id,
              customer_name,
              table_id,
              table_title,
              floor,
              status,
              payment_status,
              token_no,
              items,
            } = order;

            return (
              <div
                key={index}
                className="flex flex-col px-4 py-5 border border-restro-border-green-light rounded-2xl"
              >
                <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                      {delivery_type == "dinein" ? (
                        <IconArmchair size={24} stroke={iconStroke} />
                      ) : (
                        <IconBoxSeam size={24} stroke={iconStroke} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">
                        {table_id
                          ? `${table_title}`
                          : new String(
                              `${delivery_type} ${customer_type}`
                            ).toUpperCase()}
                      </p>
                      {floor && <p className="text-sm">{floor}</p>}
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-bold">Token: {token_no}</p>
                  </div>
                </div>

                {/* order items */}
                <div className="flex flex-col mt-4 divide-y">
                  {items?.map((item, index) => {
                    const {
                      id: orderItemId,
                      order_id,
                      item_id,
                      item_title,
                      variant_id,
                      variant_title,
                      quantity,
                      status,
                      date,
                      addons,
                      notes,
                    } = item;

                    console.log("adddons...", addons);
                    const addonsText =
                      addons?.length > 0
                        ? addons?.map((a) => a?.title)?.join(", ")
                        : [0];

                    return (
                      <div key={index} className="flex items-center gap-2 py-2">
                        {/* status */}
                        {status == "preparing" && (
                          <IconClock
                            stroke={iconStroke}
                            className="text-amber-500"
                          />
                        )}
                        {status == "completed" && (
                          <IconCheck
                            stroke={iconStroke}
                            className="text-green-500"
                          />
                        )}
                        {status == "cancelled" && (
                          <IconX stroke={iconStroke} className="text-red-500" />
                        )}
                        {status == "delivered" && (
                          <IconChecks
                            stroke={iconStroke}
                            className="text-green-500"
                          />
                        )}
                        {/* status */}

                        {/* item title */}
                        <div className="flex-1">
                          <p>
                            {item_title} {variant_title} x {quantity}
                          </p>

                          {addonsText && (
                            <p className="text-sm text-gray-700">
                              Addons: {addonsText || "test"}
                            </p>
                          )}
                          {notes && (
                            <p className="text-sm text-gray-700">
                              Notes: {notes}
                            </p>
                          )}
                        </div>
                        {/* item title */}

                        {/* action */}
                        {status == "created" && (
                          <button
                            onClick={() => {
                              btnStartPreparingOrderItem(orderItemId);
                            }}
                            className="btn btn-sm"
                          >
                            Start Making
                          </button>
                        )}
                        {status == "preparing" && (
                          <button
                            onClick={() => {
                              btnCompletePreparingOrderItem(orderItemId);
                            }}
                            className="btn btn-sm"
                          >
                            Complete
                          </button>
                        )}
                        {/* action */}
                      </div>
                    );
                  })}
                </div>
                {/* order items */}
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
