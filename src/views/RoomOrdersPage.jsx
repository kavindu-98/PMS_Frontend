/** @format */

import React, { useContext, useEffect, useRef, useState } from "react";
import Page from "../components/Page";
import {
  cancelKitchenOrder,
  completeKitchenOrder,
  getCompleteRoomOrderPaymentSummary,
  getRoomOrders,
  getOrdersInit,
  payAndCompleteKitchenOrder,
  updateKitchenOrderItemStatus,
  payAndCompleteRoomOrder,
} from "../controllers/orders.controller";
import { validatePromoCode } from "../controllers/pos.controller";
import { toast } from "react-hot-toast";
import {
  IconDoor,
  IconBoxSeam,
  IconCash,
  IconCheck,
  IconChecks,
  IconClock,
  IconDotsVertical,
  IconReceipt,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { VITE_BACKEND_SOCKET_IO, iconStroke } from "../config/config";
import { CURRENCIES } from "../config/currencies.config";
import { PAYMENT_ICONS } from "../config/payment_icons";
import { setDetailsForRoomReceiptPrint } from "../helpers/ReceiptHelper";

import { SocketContext } from "../contexts/SocketContext";
import { initSocket } from "../utils/socket";
import { textToSpeech } from "../utils/textToSpeech";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";

export default function RoomOrdersPage() {
  const printReceiptRef = useRef();
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const [state, setState] = useState({
    roomOrders: [],
    printSettings: null,
    storeSettings: null,
    paymentTypes: [],
    isLoading: true,

    cancelOrderIds: [],
    completeOrderIds: [],
    completeServicesIds: [],
    completeTokenIds: "",
    room_no: null,
    currency: null,

    summaryNetTotal: 0,
    summaryTaxTotal: 0,
    summaryTotal: 0,
    summaryGrandTotal: 0,
    summaryDiscount: 0,
    summaryTotalAdv: 0,
    summaryOrders: [],
    roomsorder: [],
    roomNo: "",
    order: null,
    message: "",
    miscellaneousCharges: 0,
    note: "",

    promocodeType: "",
    promocode: "",

    selectedPaymentType: null,
  });

  const [showCreditCardPopup, setShowCreditCardPopup] = useState(false); // State for credit card popup
  const [creditCardDigits, setCreditCardDigits] = useState(""); // State for credit card digits
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    _init();
    _initSocket();
  }, []);

  const {
    roomOrders,
    printSettings,
    storeSettings,
    paymentTypes,
    isLoading,
    currency,
  } = state;

  const _init = async () => {
    try {
      const [ordersResponse, ordersInitResponse] = await Promise.all([
        getRoomOrders(),
        getOrdersInit(),
      ]);

      if (ordersResponse.status == 200 && ordersInitResponse.status == 200) {
        const orders = ordersResponse?.data || [];
        const ordersInit = ordersInitResponse.data;

        const currency = CURRENCIES.find(
          (c) => c.cc == ordersInit?.storeSettings?.currency
        );

        setState({
          ...state,
          roomOrders: orders,
          printSettings: ordersInit.printSettings || {},
          storeSettings: ordersInit.storeSettings || {},
          paymentTypes: ordersInit.paymentTypes || {},
          currency: currency?.symbol,
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

  const refreshOrders = async () => {
    try {
      toast.loading("Please wait...");
      const res = await getRoomOrders();
      toast.dismiss();
      if (res.status == 200) {
        toast.success("Orders Loaded!");
        setState({
          ...state,
          roomOrders: res.data,
          isLoading: false,
        });
      }
    } catch (error) {
      const message =
        error.response.data.message ||
        "Error loading orders! Please try later!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
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
        refreshOrders();
      });

      socket.on("order_update", () => {
        console.log("Order update");
        refreshOrders();
      });
    } else {
      initSocket();
      socket.emit("authenticate", user.tenant_id);
      socket.on("new_order", (payload) => {
        console.log(payload);
        // textToSpeech(`New order received, token number: ${payload}`);
        audio.play();
        refreshOrders();
      });

      socket.on("order_update", () => {
        console.log("Order update");
        refreshOrders();
      });
    }
  };

  const closeModal = () => {
    // Reset credit card digits when closing the modal
    setCreditCardDigits("");

    setState((prevState) => ({
      ...prevState,
      promocodeType: "",
      promocode: "",
      message: "",
      selectedPaymentType: "", // Uncheck the selected payment type
      miscellaneousCharges: "",
      note: "",
    }));
    // Close the modal logic, if needed (e.g., calling `close()` on the dialog)
    document.getElementById("modal-order-summary-complete").close();
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

  if (state.isLoading) {
    return <Page>Please wait...</Page>;
  }

  const btnChangeOrderItemStatus = async (orderItemId, status) => {
    try {
      toast.loading("Please wait...");
      const res = await updateKitchenOrderItemStatus(orderItemId, status);
      toast.dismiss();
      if (res.status == 200) {
        sendOrderUpdateEvent();
        await refreshOrders();
        toast.success(res.data.message);
        document.getElementById("modal-order-item-status-update").showModal();
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

  const btnShowCreditCardPopup = () => {
    document.getElementById("modal-credit-card-details").showModal();
  };

  const btnShowCancelOrderModal = (orderIds) => {
    setState({
      ...state,
      cancelOrderIds: orderIds,
    });
    document.getElementById("modal-order-cancel").showModal();
  };
  const btnCancelOrder = async () => {
    try {
      toast.loading("Please wait...");
      const res = await cancelKitchenOrder(state.cancelOrderIds);
      toast.dismiss();
      if (res.status == 200) {
        sendOrderUpdateEvent();
        await refreshOrders();
        toast.success(res.data.message);
        document.getElementById("modal-order-cancel").close();
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

  // Handle Credit Card Popup Save
  const handleSaveCreditCardDetails = (e) => {
    setCreditCardDigits(e.target.value);
    setShowCreditCardPopup(false); // Close popup after saving
  };

  const btnShowCompleteOrderModal = (orderIds) => {
    setState({
      ...state,
      completeOrderIds: orderIds,
    });
    document.getElementById("modal-order-complete").showModal();
  };
  const btnCompleteOrder = async () => {
    try {
      toast.loading("Please wait...");
      const res = await completeKitchenOrder(state.completeOrderIds);
      toast.dismiss();
      if (res.status == 200) {
        sendOrderUpdateEvent();
        await refreshOrders();
        toast.success(res.data.message);
        document.getElementById("modal-order-complete").close();
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

  // Handle checkbox selection
  const handleCheckboxChange = (order) => {
    setSelectedOrders((prevSelected) => {
      const existingIndex = prevSelected.findIndex(
        (o) => o.room_no === order.room_no
      );

      if (existingIndex !== -1) {
        // Remove the existing room from selection
        return prevSelected.filter((o) => o.room_no !== order.room_no);
      } else {
        // Add room with its order IDs
        return [
          ...prevSelected,
          {
            room_no: order.room_no,
            orderIds: order.order_ids || [],
            servicesIds: order.services_id || [],
          },
        ];
      }
    });
  };

  const btnShowPayAndComplete = async (selectedOrders) => {
    console.log(
      "selectedOrders selectedOrders selectedOrders123",
      selectedOrders
    );
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order.");
      return;
    }

    // Format the selected orders into the required structure
    const rooms = selectedOrders?.map((order) => ({
      room_no: order.room_no,
      orderIds: order.orderIds ? order.orderIds.map(String) : [],
      servicesIds: order.servicesIds ? order.servicesIds.map(String) : [],
    }));

    try {
      toast.loading("Please wait...");

      // Fetch complete room order payment summary
      const res = await getCompleteRoomOrderPaymentSummary(rooms);
      toast.dismiss();

      if (res.status === 200) {
        const {
          totalSubtotal,
          totalTax,
          totalAdvanceAmount,
          grandTotal,
          rooms,
        } = res.data;

        let orders = [];
        let orderIds = [];
        let servicesIds = [];
        let discount = 0;
        let promocodeType1 = "";
        let promocode1 = "";

        // Extracting orders from each room
        rooms.forEach((room) => {
          if (room.orders && room.orders.length > 0) {
            orders = [...orders, ...room.orders]; // Collecting all orders from rooms
          }
        });
        // Extracting orderids from each room
        rooms.forEach((room) => {
          if (room.orders && room?.orders?.length > 0) {
            orderIds = [...orderIds, ...room.orders.map((order) => order.id)];
          }
        });

        // Extracting serviceIds from each room
        rooms.forEach((room) => {
          if (room.allServices && room?.allServices?.length > 0) {
            servicesIds = [
              ...servicesIds,
              ...room.orders.map((order) => order.id),
            ];
          }
        });

        // Extracting token numbers
        const tokenNoArray = orders.map((o) => o.token_no);
        const tokens = tokenNoArray.join(",");

        // Getting discount and promocode details from the first order (if available)
        if (orders.length > 0) {
          discount = orders[0].discount || 0;
          promocodeType1 = orders[0].promocodeType || "";
          promocode1 = orders[0].promocode || "";
        }

        console.log("Discount:", discount);
        console.log("Promocode Type:", promocodeType1);
        console.log("Promocode:", promocode1);
        console.log("Tokens:", tokens);
        console.log("orders  0:", orders);

        setState((prevState) => ({
          ...prevState,
          summaryNetTotal: totalSubtotal,
          summaryTaxTotal: totalTax,
          summaryGrandTotal: grandTotal,
          summaryTotal: grandTotal - discount,
          summaryDiscount: discount,
          summaryTotalAdv: totalAdvanceAmount,
          promocodeType: promocodeType1,
          promocode: promocode1,
          completeOrderIds: orderIds,
          completeServicesIds: servicesIds,
          completeTokenIds: tokens,
          summaryOrders: orders,
          order: orders,
          roomsorder: rooms,
        }));

        document.getElementById("modal-order-summary-complete").showModal();
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

  //  Function to handle Miscellaneous Charges input changes
  const handleMiscellaneousChargesChange = (e) => {
    const chargeAmount = parseFloat(e.target.value) || 0;

    setState((prevState) => {
      const miscellaneousCharges = chargeAmount || 0;
      console.log("prevState.grandTotal", prevState.grandTotal);
      const summaryTotal =
        parseFloat(prevState.summaryGrandTotal) + chargeAmount;
      return {
        ...prevState,
        miscellaneousCharges,
        summaryTotal,
      };
    });
  };

  const handleNotesChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      note: e.target.value,
    }));
  };

  const btnPayAndComplete = async (selectedOrders) => {
    const isPrintReceipt = printReceiptRef.current?.checked || false;

    console.log("Selected selectedOrders:", selectedOrders);

    try {
      toast.loading("Please wait...");
      const rooms = selectedOrders?.map((order) => ({
        room_no: order.room_no,
        orderIds: order.orders.map((o) => o.id.toString()), // Convert order IDs to string
        services: order.allServices.flatMap(
          (service) => service.items.map((item) => item.id.toString()) // Convert service IDs to string
        ),
      }));

      console.log(rooms);

      const payload = {
        creditCardDigits: String(state.creditCardDigits || ""),
        discount: String(state.summaryDiscount || 0),
        rooms,
        promocode: String(state.promocode || ""),
        promocodeType: String(state.promocodeType || ""),
        selectedPaymentType: String(state.selectedPaymentType || ""),
        subTotal: String(state.summaryNetTotal || 0),
        taxTotal: String(state.summaryTaxTotal || 0),
        total: String(state.summaryTotal || 0),
        miscellaneousCharges: String(state.miscellaneousCharges || 0),
        note: String(state.note || ""),
        serviceCharge: String(true),
      };

      console.log("Processing Payment with Payload:", payload);

      const res = await payAndCompleteRoomOrder(payload);

      toast.dismiss();

      if (res.status === 200) {
        sendOrderUpdateEvent();
        await refreshOrders();
        toast.success(res.data.message);
        document.getElementById("modal-order-summary-complete").close();
        setCreditCardDigits("");

        if (isPrintReceipt) {
          console.log("Fetching Payment Summary from State for Receipt...");

          const ordersByRoom = state.summaryOrders.reduce((acc, order) => {
            acc[order.room_no] = acc[order.room_no] || [];
            acc[order.room_no].push(
              ...order.items.map((i) => ({
                ...i,
                title: i.item_title,
                addons_ids: i?.addons?.map((a) => a.id) || [],
                variant: i.variant_id
                  ? {
                      id: i.variant_id,
                      title: i.variant_title,
                      price: i.variant_price,
                    }
                  : null,
                roomNo: order.room_no,
              }))
            );
            return acc;
          }, {});

          // Group additional service by room number
          const addServiceByRoom = state.roomsorder.reduce((acc, room) => {
            acc[room.room_no] = room?.allServices?.map((service) => ({
              token_no: service.token_no || null,
              advanced_amount: service.advanced_amount || null,
              note: service.note || "",
              room_no: room.room_no,
              discount: service.discount || null,
              items: service?.items?.map((i) => ({
                id: i.id,
                services: i.services,
                sub_services: i.sub_services,
                count: i.count,
                final_price: i.final_price,
                price: i.price,
                tax_value: i.tax_value,
              })),
            }));

            return acc;
          }, {});

          console.log("services grouped by room:", addServiceByRoom);

          const paymentType = paymentTypes.find(
            (v) => v.id == state.selectedPaymentType
          );
          let paymentMethodText;
          if (paymentType) {
            paymentMethodText = paymentType.title;
          }

          const receiptDetails = {
            cartItems: ordersByRoom,
            serviceItems: addServiceByRoom,
            currency,
            storeSettings,
            printSettings,
            roomDetails: state.roomsorder?.map((room) => ({
              roomNo: room.room_no,
              status: room.room_status,
              checkIn: room.check_in_date,
              checkOut: room.check_out_date,
              note: room.note,
              advancedAmount: room.advanced_amount,
              finalPrice: room.final_price,
              bookingType: room.booking_type,
              customer:
                room.orders.length > 0
                  ? {
                      id: room.orders[0].customer_id,
                      name: room.orders[0].customer_name,
                      type: room.orders[0].customer_type,
                    }
                  : null,
            })),

            itemsTotal: state.summaryNetTotal,
            taxTotal: state.summaryTaxTotal,
            payableTotal: state.summaryTotal,
            advanceTotal: state.summaryTotalAdv,
            tokenNo: state.completeTokenIds,
            orderId: state.completeOrderIds.join(", "),
            paymentMethod: paymentMethodText,
          };

          setDetailsForRoomReceiptPrint(receiptDetails);
          console.log("Updated Receipt Details:", receiptDetails);

          const receiptWindow = window.open(
            "/print-room-receipt",
            "_blank",
            "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
          );

          if (receiptWindow) {
            receiptWindow.onload = () => {
              setTimeout(() => {
                receiptWindow.print();
              }, 500);
            };
          } else {
            toast.error("Unable to open print window.");
          }
        }
      }
    } catch (error) {
      toast.dismiss();
      console.error("Payment Processing Error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Error processing your request, Please try later!"
      );
    }
  };

  const btnPrintReceipt = async (selectedOrders) => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order.");
      return;
    }

    // Format the selected orders into the required structure
    const rooms = selectedOrders?.map((order) => ({
      room_no: order.room_no,
      orderIds: order.orderIds ? order.orderIds.map(String) : [],
      servicesIds: order.servicesIds ? order.servicesIds.map(String) : [],
    }));

    try {
      toast.loading("Please wait...");
      const res = await getCompleteRoomOrderPaymentSummary(rooms);
      toast.dismiss();

      if (res.status === 200) {
        const {
          totalSubtotal,
          totalTax,
          totalAdvanceAmount,
          grandTotal,
          rooms,
        } = res.data;

        // Group orders by room number
        const ordersByRoom = rooms.reduce((acc, room) => {
          acc[room.room_no] = [];

          room.orders.forEach((o) => {
            o.items.forEach((i) => {
              acc[room.room_no].push({
                ...i,
                title: i.item_title,
                addons_ids:
                  i?.addons?.length > 0 ? i?.addons?.map((a) => a.id) : [],
                variant: i.variant_id
                  ? {
                      id: i.variant_id,
                      title: i.variant_title,
                      price: i.variant_price,
                    }
                  : null,
                roomNo: room.room_no,
              });
            });
          });

          return acc;
        }, {});

        console.log("Orders grouped by room:", ordersByRoom);

        // Group additional service by room number
        const addServiceByRoom = rooms.reduce((acc, room) => {
          acc[room.room_no] = room?.allServices?.map((service) => ({
            token_no: service.token_no || null,
            advanced_amount: service.advanced_amount || null,
            note: service.note || "",
            room_no: room.room_no,
            discount: service.discount || null,
            items: service?.items?.map((i) => ({
              id: i.id,
              services: i.services,
              sub_services: i.sub_services,
              count: i.count,
              final_price: i.final_price,
              price: i.price,
              tax_value: i.tax_value,
            })),
          }));

          return acc;
        }, {});

        console.log("services grouped by room:", addServiceByRoom);

        const detailsForReceipt = {
          cartItems: ordersByRoom,
          serviceItems: addServiceByRoom,
          currency,
          storeSettings,
          printSettings,
          roomDetails: rooms?.map((room) => ({
            roomNo: room.room_no,
            status: room.room_status,
            checkIn: room.check_in_date,
            checkOut: room.check_out_date,
            note: room.note,
            advancedAmount: room.advanced_amount,
            finalPrice: room.final_price,
            bookingType: room.booking_type,
            customer:
              room.orders.length > 0
                ? {
                    id: room.orders[0].customer_id,
                    name: room.orders[0].customer_name,
                    type: room.orders[0].customer_type,
                  }
                : null,
          })),
          itemsTotal: totalSubtotal,
          taxTotal: totalTax,
          payableTotal: grandTotal,
          advanceTotal: totalAdvanceAmount,
        };

        setDetailsForRoomReceiptPrint(detailsForReceipt);
        console.log("Updated Receipt Details:", detailsForReceipt);

        const receiptWindow = window.open(
          "/print-room-receipt",
          "_blank",
          "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
        );

        receiptWindow.onload = () => {
          setTimeout(() => {
            receiptWindow.print();
          }, 400);
        };
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

  const promoCodeTypes1 = [
    { id: "corporate", name: "Corporate Promo Code" },
    { id: "digital", name: "Digital Promo Code" },
  ];

  const handlePromoTypeChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      promocodeType: e.target.value,
    }));
  };

  const HandlevalidatePromoCode = async () => {
    try {
      const promoCode = state.promocode; // Input promo code
      const promocodeType = state.promocodeType;

      const res = await validatePromoCode(promocodeType, promoCode);

      if (res.status === 200) {
        const data = res.data;

        setState((prevState) => {
          // Check if a valid discount exists
          const discountRate = data.discount || 0;
          const summaryDiscount =
            discountRate > 0
              ? (discountRate / 100) * prevState.summaryNetTotal
              : 0;
          const summaryTotal =
            prevState.summaryNetTotal +
            prevState.summaryTaxTotal -
            summaryDiscount;

          return {
            ...prevState,
            success: data.success,
            message: data.message,
            discountRate,
            summaryDiscount,
            summaryTotal,
          };
        });
      }
    } catch (error) {
      // Handle error response
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "An unexpected error occurred!";
      setState((prevState) => ({
        ...prevState,
        success: false,
        message: errorMessage,
        discountRate: 0,
        discountAmount: 0, // Reset discount amount
        summaryTotal: prevState.itemsTotal + prevState.taxTotal, // Reset payable total
      }));
    }
  };

  return (
    <Page>
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Room Orders</h3>
        <button
          onClick={refreshOrders}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconRefresh size={22} stroke={iconStroke} /> Refresh
        </button>
      </div>

      {roomOrders?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/kitchen.svg"
            alt="no orders"
            className="w-full md:w-60"
          />
          <p className="text-gray-400">No Orders Pending!</p>
        </div>
      )}

      {roomOrders?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {roomOrders?.map((order, index) => {
            const {
              room_no,
              room_status,
              booking_type,
              orders,
              order_ids,
              services_id,
              additional_services,
              check_in_date,
              check_out_date,
              advanced_amount,
              final_price,
            } = order;

            const isPaid = !room_status === "check-in";

            return (
              <div
                key={index}
                className="flex flex-col px-4 py-5 border divide-y border-restro-border-green-light rounded-2xl divide-dashed"
              >
                <div className="flex flex-col items-center gap-2 pb-2 text-center md:flex-row md:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                      <IconDoor size={24} stroke={iconStroke} />
                    </div>
                    <div>
                      {room_no && (
                        <p className="text-sm">Room No : {room_no}</p>
                      )}
                      {booking_type && (
                        <p className="text-sm">{booking_type}</p>
                      )}
                    </div>
                  </div>
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="m-1 bg-transparent border-none shadow-none btn btn-sm btn-circle"
                    >
                      <IconDotsVertical size={18} stroke={iconStroke} />
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <button
                          className="flex items-center gap-2 bg-transparent border-none shadow-none"
                          onClick={() =>
                            btnPrintReceipt(
                              selectedOrders.length > 0
                                ? selectedOrders
                                : [
                                    {
                                      room_no,
                                      orderIds: order_ids || [],
                                      servicesIds: services_id || [],
                                    },
                                  ]
                            )
                          }
                        >
                          <IconReceipt size={18} stroke={iconStroke} /> Print
                          Receipt
                        </button>
                      </li>
                      <li>
                        <button
                          className="flex items-center gap-2 text-green-500 bg-transparent border-none shadow-none"
                          onClick={() => {
                            if (isPaid == true) {
                              toast.error(
                                "Action cannot be processed because payment has already been collected. Please use the 'Complete' option instead."
                              );
                              return;
                            }
                            btnShowPayAndComplete(
                              selectedOrders.length > 0
                                ? selectedOrders
                                : [
                                    {
                                      room_no,
                                      orderIds: order_ids || [],
                                      servicesIds: services_id || [],
                                    },
                                  ]
                            );
                          }}
                        >
                          <IconCash size={18} stroke={iconStroke} /> Pay &
                          Complete
                        </button>
                      </li>
                    </ul>
                  </div>
                  {/* Checkbox for selection */}
                  <input
                    type="checkbox"
                    checked={selectedOrders.some((o) => o.room_no === room_no)}
                    onChange={() => handleCheckboxChange(order)}
                    className="checkbox"
                  />
                </div>

                <div className="px-2 py-2 mt-2 mb-2 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <p>
                        CheckIn :{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                        }).format(new Date(check_in_date))}{" "}
                        {""}
                        {new Intl.DateTimeFormat("en-US", {
                          timeStyle: "short",
                        }).format(new Date(check_in_date))}
                      </p>
                      <p>
                        Check Out :{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                        }).format(new Date(check_out_date))}{" "}
                        {""}
                        {new Intl.DateTimeFormat("en-US", {
                          timeStyle: "short",
                        }).format(new Date(check_out_date))}
                      </p>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    {" "}
                    <IconCash stroke={iconStroke} size={18} />{" "}
                    {advanced_amount && (
                      <p className="text-sm"> Paid Advance</p>
                    )}
                  </p>

                  {/* item title */}
                  <div className="flex-1 mt-1">
                    {advanced_amount && (
                      <p className="text-sm text-gray-700">
                        Advanced Amount: {advanced_amount}
                      </p>
                    )}
                    {final_price && (
                      <p className="text-sm text-gray-700">
                        Final Price: {final_price}
                      </p>
                    )}
                  </div>
                  {/* item title */}
                </div>

                {orders?.map((o, i) => {
                  const {
                    id,
                    date,
                    delivery_type,
                    customer_type,
                    customer_id,
                    customer_name,
                    status,
                    payment_status,
                    token_no,
                    items,
                  } = o;

                  return (
                    <div className="px-2 py-2 mt-2 mb-2 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col items-center justify-center text-center">
                          <p>Token:</p>
                          <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-full bg-slate-700">
                            {token_no}
                          </div>
                        </div>
                        <div className="text-end">
                          <p>
                            {new Intl.DateTimeFormat("en-US", {
                              timeStyle: "short",
                            }).format(new Date(date))}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-gray-500">
                            {" "}
                            <IconCash stroke={iconStroke} size={18} />{" "}
                            {payment_status}
                          </p>
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

                          const addonsText =
                            addons?.length > 0
                              ? addons?.map((a) => a?.title)?.join(", ")
                              : null;

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 py-2"
                            >
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
                                <IconX
                                  stroke={iconStroke}
                                  className="text-red-500"
                                />
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
                                    Addons: {addonsText}
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
                              <div className="dropdown dropdown-left">
                                {/* <div
                                  tabIndex={0}
                                  role="button"
                                  className="m-1 bg-transparent border-none shadow-none btn btn-sm btn-circle"
                                >
                                  <IconDotsVertical
                                    size={18}
                                    stroke={iconStroke}
                                  />
                                </div> */}
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                >
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none text-amber-500"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "preparing"
                                        );
                                      }}
                                    >
                                      <IconClock
                                        size={18}
                                        stroke={iconStroke}
                                      />{" "}
                                      Preparing
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none text-restro-green"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "completed"
                                        );
                                      }}
                                    >
                                      <IconCheck
                                        size={18}
                                        stroke={iconStroke}
                                      />{" "}
                                      Complete
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none "
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "delivered"
                                        );
                                      }}
                                    >
                                      <IconChecks
                                        size={18}
                                        stroke={iconStroke}
                                      />{" "}
                                      Delivered
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 text-red-500 bg-transparent border-none shadow-none"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "cancelled"
                                        );
                                      }}
                                    >
                                      <IconX size={18} stroke={iconStroke} />{" "}
                                      Cancel
                                    </button>
                                  </li>
                                </ul>
                              </div>
                              {/* action */}
                            </div>
                          );
                        })}
                      </div>
                      {/* order items */}
                    </div>
                  );
                })}

                <div className="mt-2 border-b border-dashed"></div>

                {additional_services?.map((o, i) => {
                  const {
                    created_at,
                    tenant_id,
                    customer_type,
                    customer_id,
                    customer_name,
                    room_no,
                    advanced_amount,
                    note,
                    discount,
                    status,
                    payment_status,
                    token_no,
                    items,
                  } = o;

                  return (
                    <div className="px-2 py-2 mt-2 mb-2 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col items-center justify-center text-center">
                          <p>Token:</p>
                          <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-full bg-slate-700">
                            {token_no}
                          </div>
                        </div>
                        <div className="text-end">
                          <p>
                            {new Intl.DateTimeFormat("en-US", {
                              timeStyle: "short",
                            }).format(new Date(created_at))}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-gray-500">
                            {" "}
                            <IconCash stroke={iconStroke} size={18} />{" "}
                            {payment_status}
                          </p>
                        </div>
                      </div>
                      {note && (
                        <p className="text-sm text-gray-700 mt-2">
                          Notes: {note}
                        </p>
                      )}
                      {/* order items */}
                      <div className="flex flex-col mt-4 divide-y">
                        {items?.map((item, index) => {
                          const {
                            id: orderItemId,
                            services,
                            sub_services,
                            count,
                            final_price,
                            price,
                            tax_value,
                            order_id,
                            status,
                            date,
                            addons,
                            notes,
                          } = item;

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 py-2"
                            >
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
                                <IconX
                                  stroke={iconStroke}
                                  className="text-red-500"
                                />
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
                                  {services} {sub_services} x {count}
                                </p>

                                {notes && (
                                  <p className="text-sm text-gray-700">
                                    Notes: {notes}
                                  </p>
                                )}
                              </div>
                              {/* item title */}

                              {/* action */}
                              <div className="dropdown dropdown-left">
                                {/* <div
                                  tabIndex={0}
                                  role="button"
                                  className="m-1 bg-transparent border-none shadow-none btn btn-sm btn-circle"
                                >
                                  <IconDotsVertical
                                    size={18}
                                    stroke={iconStroke}
                                  />
                                </div> */}
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                >
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none text-amber-500"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "preparing"
                                        );
                                      }}
                                    >
                                      <IconClock
                                        size={18}
                                        stroke={iconStroke}
                                      />{" "}
                                      Preparing
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none text-restro-green"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "completed"
                                        );
                                      }}
                                    >
                                      <IconCheck
                                        size={18}
                                        stroke={iconStroke}
                                      />{" "}
                                      Complete
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none "
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "delivered"
                                        );
                                      }}
                                    >
                                      <IconChecks
                                        size={18}
                                        stroke={iconStroke}
                                      />{" "}
                                      Delivered
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 text-red-500 bg-transparent border-none shadow-none"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "cancelled"
                                        );
                                      }}
                                    >
                                      <IconX size={18} stroke={iconStroke} />{" "}
                                      Cancel
                                    </button>
                                  </li>
                                </ul>
                              </div>
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
            );
          })}
        </div>
      )}

      {/* dialog: successful order item status update */}
      <dialog id="modal-order-item-status-update" className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Success!</h3>
          <p className="py-4">Order Item status successfully updated!</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: successful order item status update */}

      {/* dialog: cancel order */}
      <dialog id="modal-order-cancel" className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Alert!</h3>
          <p className="py-4">
            Are you sure, you are cancelling the order! This process is not
            reversible. 🛑✋
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Dismiss</button>
              <button
                onClick={() => {
                  btnCancelOrder();
                }}
                className="ml-2 text-white bg-red-500 btn hover:bg-red-700"
              >
                Yes Confirm!
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: cancel order */}

      {/* dialog: complete order */}
      <dialog id="modal-order-complete" className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Alert!</h3>
          <p className="py-4">
            Are you sure, you are completing the order! 🛑✋
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Dismiss</button>
              <button
                onClick={() => {
                  btnCompleteOrder();
                }}
                className="ml-2 text-white btn hover:bg-restro-green-dark bg-restro-green"
              >
                Yes Confirm!
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: complete order */}
      {/* dialog: modal-credit-card-details */}
      <dialog
        id="modal-credit-card-details"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="text-lg font-bold">
            Enter Last 4 Digits of Credit Card
          </h3>
          <input
            type="text"
            maxLength={4}
            value={creditCardDigits || ""}
            onChange={handleSaveCreditCardDetails}
            placeholder="Enter last 4 digits"
            className="w-full px-4 py-2 my-4 text-gray-500 border rounded-lg bg-gray-50 focus:outline-restro-border-green-light"
          />
          <div className="modal-action">
            <button
              onClick={() =>
                document.getElementById("modal-credit-card-details").close()
              }
              className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Add save logic here
                document.getElementById("modal-credit-card-details").close();
                toast.success("Credit Card Details Saved!");
              }}
              className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>

      {/* dialog: complete order & payment summary */}
      <dialog id="modal-order-summary-complete" className="modal">
        <div className="modal-box">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Pay & Complete Room Order!</h3>
            <form method="dialog">
              <button
                className="text-red-500 transition border-none hover:bg-red-100 active:scale-95 bg-red-50 btn btn-sm btn-circle"
                onClick={closeModal}
              >
                <IconX size={18} stroke={iconStroke} />
              </button>
            </form>
          </div>

          {state.order ? (
            // Render this block if `state.order` exists
            <div>
              <div className="flex items-center w-full divide-x gap-x-3">
                <div className="flex-1 text-center">
                  <p>Subtotal</p>
                  <p className="text-l">
                    {currency}
                    {Number(state.summaryNetTotal).toFixed(2)}
                  </p>
                </div>

                <div className="flex-1 text-center">
                  <p>Tax</p>
                  <p className="text-l">
                    {currency}
                    {Number(state.summaryTaxTotal).toFixed(2)}
                  </p>
                </div>

                {state.summaryDiscount > 0 && (
                  <div className="flex-1 text-center">
                    <p>Discount</p>
                    <p className="text-l">
                      -{currency}
                      {Number(state.summaryDiscount).toFixed(2)}
                    </p>
                  </div>
                )}
                {state.miscellaneousCharges > 0 && (
                  <div className="flex-1 text-center">
                    <p>Addtinal Charges</p>
                    <p className="text-l">
                      {currency}
                      {Number(state.miscellaneousCharges).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex-1 text-center">
                  <p>Total</p>
                  <p className="text-2xl font-bold text-restro-green">
                    {currency}
                    {Number(state.summaryTotal).toFixed(2)}
                  </p>
                </div>
              </div>

              <label
                htmlFor="print_receipt"
                className="flex items-center justify-end w-full gap-2 mt-4 "
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  id="print_receipt"
                  ref={printReceiptRef}
                />{" "}
                Print Receipt?
              </label>
              <div className="my-4 mt-5">
                <label
                  htmlFor="notes"
                  className="block mb-1 text-sm text-gray-500"
                >
                  Miscellaneous & Additional Charges (Notes)
                </label>
                <textarea
                  name="notes"
                  placeholder="Enter Notes Here..."
                  className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  onChange={handleNotesChange}
                  value={state.note}
                ></textarea>
              </div>

              <div className="flex-1 mt-4">
                <label
                  htmlFor="finalPrice"
                  className="block mb-1 text-sm text-gray-500"
                >
                  Charge Amount Rs.
                </label>
                <input
                  type="number"
                  name="finalPrice"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  placeholder="Enter Final Price"
                  min={0}
                  onChange={handleMiscellaneousChargesChange}
                  value={state.miscellaneousCharges}
                />
              </div>

              {/* Promo Code Type Section */}
              <div className="flex flex-col gap-2 mt-4 mb-4">
                <label
                  htmlFor="promoCodeType"
                  className="block mb-1 text-sm text-gray-500"
                >
                  Select Promo Code Type:
                </label>
                <select
                  value={state.promocodeType || ""}
                  onChange={handlePromoTypeChange}
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  placeholder="Select Promo Code type"
                >
                  <option value="" disabled>
                    Select Promo Code Type
                  </option>
                  {promoCodeTypes1?.map((option, index) => (
                    <option key={index} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Promo Code Section */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Promo Code"
                  className="w-full px-4 py-2 text-gray-500 border rounded-lg bg-gray-50 focus:outline-restro-border-green-light"
                  value={state.promocode || ""}
                  onChange={(e) =>
                    setState((prevState) => ({
                      ...prevState,
                      promocode: e.target.value,
                    }))
                  }
                />
                <button
                  onClick={HandlevalidatePromoCode}
                  className="px-4 py-2 text-white transition bg-green-800 rounded-lg hover:bg-green-700 active:scale-95"
                >
                  Apply
                </button>
              </div>

              {/* Response Message Section */}
              {state.message && (
                <div
                  className={`text-sm px-4 py-2 rounded-lg mb-4 ${
                    state.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {state.message}
                </div>
              )}
            </div>
          ) : (
            // Render this block if `state.order` does not exist
            <>
              <div className="flex items-center w-full divide-x gap-x-3">
                <div className="flex-1 text-center">
                  <p>Subtotal</p>
                  <p className="text-l">
                    {currency}
                    {Number(state.summaryNetTotal).toFixed(2)}
                  </p>
                </div>

                <div className="flex-1 text-center">
                  <p>Tax</p>
                  <p className="text-l">
                    {currency}
                    {Number(state.summaryTaxTotal).toFixed(2)}
                  </p>
                </div>

                {state.summaryDiscount > 0 && (
                  <div className="flex-1 text-center">
                    <p>Discount</p>
                    <p className="text-l">
                      -{currency}
                      {Number(state.summaryDiscount).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex-1 text-center">
                  <p>Total</p>
                  <p className="text-2xl font-bold text-restro-green">
                    {currency}
                    {Number(state.summaryTotal).toFixed(2)}
                  </p>
                </div>
              </div>

              <label
                htmlFor="print_receipt"
                className="flex items-center justify-end w-full gap-2 mt-4 "
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  id="print_receipt"
                  ref={printReceiptRef}
                />{" "}
                Print Receipt?
              </label>

              {state.promocodeType && state.promocode && (
                <>
                  <div className="flex flex-col gap-2 mb-4">
                    <label
                      htmlFor="promoCodeType"
                      className="block mb-1 text-sm text-gray-500"
                    >
                      Select Promo Code Type:
                    </label>
                    <select
                      value={state.promocodeType || ""}
                      disabled
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    >
                      <option value="" disabled>
                        Select Promo Code Type
                      </option>
                      {promoCodeTypes1?.map((option, index) => (
                        <option key={index} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Promo Code Section */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      className="w-full px-4 py-2 text-gray-500 border rounded-lg bg-gray-50 focus:outline-restro-border-green-light"
                      value={state.promocode || ""}
                      disabled
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="grid grid-cols-3 gap-2">
            {paymentTypes?.map((paymentType, i) => {
              return (
                <label key={i} className="">
                  <input
                    checked={state?.selectedPaymentType == paymentType?.id}
                    onChange={(e) => {
                      setState({
                        ...state,
                        selectedPaymentType: e.target.value,
                      });
                      // Show the Credit Card popup if "Credit Card" is selected
                      if (paymentType?.title === "Credit Card") {
                        btnShowCreditCardPopup();
                      }
                    }}
                    type="radio"
                    name="payment_type"
                    id={paymentType?.icon}
                    value={paymentType?.id}
                    className="hidden peer"
                  />
                  <label
                    htmlFor={paymentType?.icon}
                    className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-gray-500 transition border cursor-pointer rounded-2xl peer-checked:border-restro-green peer-checked:text-restro-green peer-checked:font-bold"
                  >
                    {paymentType?.icon ? (
                      <div>{PAYMENT_ICONS[paymentType?.icon]}</div>
                    ) : (
                      <></>
                    )}
                    <p className="text-xs">{paymentType.title}</p>
                  </label>
                </label>
              );
            })}
          </div>

          {/* Response Message Section */}
          {creditCardDigits && (
            <div
              className={`text-sm px-4 py-2 rounded-lg mb-4 mt-4 ${
                creditCardDigits
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              **** **** **** {creditCardDigits}
            </div>
          )}

          <div className="modal-action">
            <form method="dialog" className="w-full">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  btnPayAndComplete(state.roomsorder);
                }}
                className="w-full text-white btn hover:bg-restro-green-dark bg-restro-green"
              >
                Pay & Complete Room Order
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: complete order & payment summary */}
    </Page>
  );
}
