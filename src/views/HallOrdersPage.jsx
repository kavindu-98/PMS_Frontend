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
  getCompleteHallOrderPaymentSummary,
} from "../controllers/orders.controller";
import { validatePromoCode } from "../controllers/pos.controller";
import { toast } from "react-hot-toast";
import {
  IconBuilding,
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
import {
  payAndCompleteHallReservation,
  useIncompleteHallReservations,
} from "../controllers/hall_reservation.controller";
import { useServiceCharge } from "../controllers/settings.controller";

export default function HallOrdersPage() {
  const printReceiptRef = useRef();
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const [state, setState] = useState({
    summaryNetTotal: 0, // Subtotal before tax and discount
    summaryTotal: 0, // Final total amount
    summaryDiscount: 0, // Applied discount amount
    summaryTaxTotal: 0, // Tax amount (if applicable)
    selectedPaymentType: "", // Payment type selected by the user
    promocodeType: "", // Selected promo code type
    promocode: "", // Promo code applied
    success: false, // Flag for success message display
    message: "", // Message for promo code response
    hall_id: "", // Hall ID related to the reservation
    roomNo: "",
    weddingReservationId: "",
  });

  const [showCreditCardPopup, setShowCreditCardPopup] = useState(false); // State for credit card popup
  const [creditCardDigits, setCreditCardDigits] = useState(""); // State for credit card digits
  const [miscCharges, setMiscCharges] = useState(0);

  const [isServiceChargeApplied, setIsServiceChargeApplied] = useState(false);
  const { data: serviceChargeData } = useServiceCharge();
  const serviceChargePercentage = serviceChargeData?.ServiceCharges || 0;

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

  const {
    data,
    error: errorHallReservations,
    isLoading: isLoadinghallReservations,
  } = useIncompleteHallReservations();

  const hallReservations = Array.isArray(data?.data) ? data.data : []; // Ensure it's an array

  const refreshOrders = async () => {
    try {
      toast.loading("Please wait...");
      const res = await getRoomOrders();
      window.location.reload();
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

  //   console.log("orderIds before conversion", orderIds);

  //   // Convert `orderIds` to strings
  //   //const stringOrderIds = orderIds.map((id) => String(id));

  //   console.log("orderIds after conversion", id);
  //   console.log("room_no", order.hall_id);

  //   const hall_id = order.hall_id;

  //   try {
  //     toast.loading("Please wait...");

  //     // Pass `stringOrderIds` instead of `orderIds`
  //     // const res = await getCompleteRoomOrderPaymentSummary(
  //     //   stringOrderIds,
  //     //   room_no
  //     // );

  //     toast.dismiss();

  //     if (res.status == 200) {
  //       const { subtotal, taxTotal, total, orders, room_no } = res.data;
  //       console.log("orders last ", res);

  //       const tokenNoArray = orders.map((o) => o.token_no);
  //       const tokens = tokenNoArray.join(",");
  //       let discount = 0;
  //       let promocodeType1 = "";
  //       let promocode1 = "";

  //       if (orders[0]?.discount) {
  //         discount = orders[0].discount;
  //         // console.log("Discount is:", discount);
  //       }

  //       if (orders[0]?.promocodeType && orders[0]?.promocode) {
  //         promocodeType1 = orders[0].promocodeType;
  //         promocode1 = orders[0].promocode;
  //         // console.log("promocodeType1:", promocodeType1);
  //         // console.log("promocode1:", promocode1);
  //       }

  //       setState({
  //         ...state,
  //         summaryNetTotal: subtotal,
  //         summaryTaxTotal: taxTotal,
  //         summaryTotal: total - discount,
  //         summaryDiscount: discount,
  //         summaryOrders: orders,
  //         roomNo: room_no,
  //         promocodeType: promocodeType1 || "",
  //         promocode: promocode1 || "",
  //         completeOrderIds: stringOrderIds, // Use string orderIds here
  //         completeTokenIds: tokens,
  //         order: order,
  //       });

  //       document.getElementById("modal-order-summary-complete").showModal();
  //     }
  //   } catch (error) {
  //     const message =
  //       error?.response?.data?.message ||
  //       "Error processing your request, Please try later!";
  //     toast.dismiss();
  //     console.error(error);
  //     toast.error(message);
  //   }
  // };
  useEffect(() => {
    setState((prevState) => {
      const subtotal = Number(prevState.summaryNetTotal) || 0;
      const advancePayment = Number(prevState.advancePayment) || 0;
      const additionalCharges = Number(miscCharges) || 0; //  Ensure miscCharges is a number

      const finalPrice = subtotal - advancePayment + additionalCharges; //  Apply miscCharges

      return {
        ...prevState,
        summaryTotal: finalPrice, //  Updated final price without service charge
      };
    });
  }, [
    state.summaryNetTotal,
    state.advancePayment,
    miscCharges, //  Removed service charge & only update based on miscCharges
  ]);

  const btnShowPayAndComplete = async (id, order) => {
    console.log("Order ID before assignment:", id);
    console.log("Order Object:", order);

    try {
      toast.loading("Please wait...");

      // Extract necessary details from order
      const subtotal = Number(order.sub_total) || 0;
      const total = Number(order.total) || 0;
      const discount = Number(order.discount) || 0;
      const hall_id = order.hall_id;
      const advancePayment = Number(order.advance_payment) || 0;
      const additionalCharges = Number(miscCharges) || 0;

      const finalPrice = subtotal - advancePayment + additionalCharges;

      const roomNo = order.room_no;
      const weddingReservationId = order.wedding_reservation_id; //  Ensure we use the correct property

      console.log("Extracted weddingReservationId:", weddingReservationId);

      let promocodeType1 = "";
      let promocode1 = "";

      if (order.promocodeType && order.promocode) {
        promocodeType1 = order.promocodeType;
        promocode1 = order.promocode;
      }

      setState((prevState) => ({
        ...prevState,
        summaryNetTotal: subtotal,
        summaryTotal: finalPrice,
        summaryDiscount: discount,
        summaryTaxTotal: 0,
        selectedPaymentType: "",
        promocodeType: promocodeType1,
        promocode: promocode1,
        hall_id: hall_id,
        roomNo: roomNo,
        weddingReservationId: weddingReservationId, //  Save correct ID
        advancePayment: advancePayment,
      }));

      document.getElementById("modal-order-summary-complete").showModal();
      toast.dismiss();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Error processing your request, Please try later!";
      toast.dismiss();
      console.error(error);
      toast.error(message);
    }
  };

  const btnPayAndComplete = async () => {
    console.log("Room No:", state.roomNo);
    console.log("Wedding Reservation ID:", state.weddingReservationId); // ✅ Check if this is null

    try {
      toast.loading("Processing payment, please wait...");

      // Convert state values to numbers safely
      const subtotal = Number(state.summaryNetTotal) || 0;
      const advancePayment = Number(state.advancePayment) || 0;
      const baseTotal = subtotal - advancePayment;

      const serviceChargeAmount = isServiceChargeApplied
        ? (baseTotal * (Number(serviceChargePercentage) || 0)) / 100
        : 0;

      const additionalCharges = Number(miscCharges) || 0;
      const finalTotal = baseTotal + serviceChargeAmount + additionalCharges;

      const payload = {
        creditCardDigits:
          state.selectedPaymentType === "card" ? creditCardDigits : "",
        discount: state.summaryDiscount.toString(),
        roomReservationId: state.roomNo ? state.roomNo.toString() : null,
        weddingReservationId: state.weddingReservationId
          ? state.weddingReservationId.toString()
          : null, // ✅ Ensure it's not null
        promocode: state.promocode || "",
        promocodeType: state.promocodeType || "",
        selectedPaymentType: state.selectedPaymentType === "card" ? "2" : "1",
        subTotal: subtotal.toFixed(2).toString(),
        taxTotal: state.summaryTaxTotal.toFixed(2).toString(),
        total: finalTotal.toFixed(2).toString(),
        miscellaneousCharges: additionalCharges.toFixed(2).toString(),
        note: "test.",
        serviceCharge: isServiceChargeApplied ? "true" : "false",
      };

      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const res = await payAndCompleteHallReservation(payload);
      console.log("API Response:", res);

      toast.dismiss();

      if (res?.success) {
        toast.success(res.message);
        document.getElementById("modal-order-summary-complete").close();
        setCreditCardDigits("");
      } else {
        toast.error("Payment failed! Please try again.");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error:", error);
      toast.error("Error processing your request, please try later!");
    }
  };

  const btnPrintReceipt = async (id) => {
    try {
      toast.loading("Please wait...");

      const res = await getCompleteHallOrderPaymentSummary(id);
      toast.dismiss();

      if (res.status === 200 && res.data.success) {
        const {
          packageName,
          guestCount,
          pricePerPerson,
          totalSubtotal,
          totalTax,
          grandTotal,
        } = res.data;

        const detailsForReceipt = {
          currency,
          storeSettings,
          printSettings,
          packageName,
          guestCount,
          pricePerPerson,
          itemsTotal: totalSubtotal,
          taxTotal: totalTax,
          payableTotal: grandTotal,
          ReservationId: id,
        };

        setDetailsForRoomReceiptPrint(detailsForReceipt);

        const receiptWindow = window.open(
          "/print-hall-receipt",
          "_blank",
          "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
        );

        if (receiptWindow) {
          receiptWindow.onload = () => {
            setTimeout(() => {
              receiptWindow.print();
            }, 400);
          };
        } else {
          toast.error("Unable to open print window.");
        }
      } else {
        toast.error("Failed to retrieve receipt details.");
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
        <h3 className="text-3xl font-light">Hall Orders</h3>
        <button
          onClick={refreshOrders}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconRefresh size={22} stroke={iconStroke} /> Refresh
        </button>
      </div>

      {hallReservations?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/kitchen.svg"
            alt="no orders"
            className="w-full md:w-60"
          />
          <p className="text-gray-400">No Orders Pending!</p>
        </div>
      )}

      {hallReservations?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {hallReservations.map((reservation, index) => {
            const {
              wedding_reservation_id,
              package_id,
              hall_id,
              hall_name,
              date,
              start_time,
              end_time,
              guest_count,
              advance_payment,
              customer_name,
              customer_phone,
              total,
              sub_total,
              discount,
              paid_status,
              payment_type,
              additional_services, // Get additional services array
            } = reservation;

            return (
              <div
                key={index}
                className="flex flex-col px-4 py-5 border divide-y border-restro-border-green-light rounded-2xl divide-dashed"
              >
                {/* Hall Details */}
                <div className="flex flex-col items-center gap-2 pb-2 text-center md:flex-row md:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                      <IconBuilding size={24} stroke={iconStroke} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">
                        {hall_name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Hall ID: {hall_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="px-2 py-2 mt-2 mb-2 bg-gray-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <p>
                      <strong>Date:</strong> {date}
                    </p>
                    <p>
                      <strong>Start Time:</strong> {start_time}
                    </p>
                    <p>
                      <strong>End Time:</strong> {end_time}
                    </p>
                    <p>
                      <strong>Guest Count:</strong> {guest_count}
                    </p>
                    <p>
                      <strong>Package ID:</strong> {package_id}
                    </p>
                  </div>
                </div>

                {/* Additional Services Section */}
                {additional_services?.length > 0 && (
                  <div className="px-2 py-2 mt-2 bg-gray-50 rounded-xl">
                    <p className="text-sm font-bold text-gray-600">
                      Additional Services:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {additional_services.map((service, i) => (
                        <li key={i}>
                          {service.services} ({service.sub_services}) - Rs.{" "}
                          {service.final_price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Payment Details */}
                <div className="px-2 py-2 mt-2 mb-2 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700">
                    <strong>Advance Payment:</strong> Rs. {advance_payment}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Final Price:</strong> Rs.{" "}
                    {sub_total - advance_payment}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Total Price:</strong> Rs. {total}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Discount:</strong> Rs. {discount}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Paid Status:</strong>{" "}
                    {paid_status === "paid" ? (
                      <span className="text-green-500">Paid</span>
                    ) : (
                      <span className="text-red-500">Not Paid</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Payment Type:</strong> {payment_type}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => btnPrintReceipt(wedding_reservation_id)}
                    className="flex items-center gap-2 text-gray-500 bg-transparent border-none shadow-none"
                  >
                    <IconReceipt size={18} stroke={iconStroke} /> Print Receipt
                  </button>

                  {paid_status !== "paid" && (
                    <button
                      className="flex items-center gap-2 text-green-500 bg-transparent border-none shadow-none"
                      onClick={() =>
                        btnShowPayAndComplete(
                          wedding_reservation_id,
                          reservation
                        )
                      }
                    >
                      <IconCash size={18} stroke={iconStroke} /> Pay & Complete
                    </button>
                  )}
                </div>
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
            <h3 className="text-lg font-bold">Pay & Complete Hall Order!</h3>
            <form method="dialog">
              <button
                className="text-red-500 transition border-none hover:bg-red-100 active:scale-95 bg-red-50 btn btn-sm btn-circle"
                onClick={closeModal}
              >
                <IconX size={18} stroke={iconStroke} />
              </button>
            </form>
          </div>

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
                  <p className="text-l">{state.summaryDiscount}%</p>
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

            {/* <label
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
              </label> */}

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
                onChange={(e) => setState({ ...state, note: e.target.value })}
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
                placeholder="Enter Additional Charges"
                min={0}
                value={miscCharges}
                onChange={(e) => setMiscCharges(Number(e.target.value) || 0)} //  Update miscCharges dynamically
              />
            </div>

            {/* Promo Code Type Section */}
            <div className="flex flex-col gap-2 mb-4">
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

          <div className="grid grid-cols-2 gap-2">
            <label>
              <input
                checked={state?.selectedPaymentType === "card"}
                onChange={() => {
                  setState({ ...state, selectedPaymentType: "card" });
                  btnShowCreditCardPopup();
                }}
                type="radio"
                name="payment_type"
                id="card"
                value="card"
                className="hidden peer"
              />
              <label
                htmlFor="card"
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-gray-500 transition border cursor-pointer rounded-2xl peer-checked:border-restro-green peer-checked:text-restro-green peer-checked:font-bold"
              >
                <div>{PAYMENT_ICONS["card"]}</div>
                <p className="text-xs">Card</p>
              </label>
            </label>

            <label>
              <input
                checked={state?.selectedPaymentType === "cash"}
                onChange={() =>
                  setState({ ...state, selectedPaymentType: "cash" })
                }
                type="radio"
                name="payment_type"
                id="cash"
                value="cash"
                className="hidden peer"
              />
              <label
                htmlFor="cash"
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-gray-500 transition border cursor-pointer rounded-2xl peer-checked:border-restro-green peer-checked:text-restro-green peer-checked:font-bold"
              >
                <div>{PAYMENT_ICONS["cash"]}</div>
                <p className="text-xs">Cash</p>
              </label>
            </label>
          </div>

          {/* Response Message Section */}
          {creditCardDigits && (
            <div className="px-4 py-2 mt-4 mb-4 text-sm text-green-800 bg-green-100 rounded-lg">
              **** **** **** {creditCardDigits}
            </div>
          )}

          <div className="modal-action">
            <form method="dialog" className="w-full">
              <button
                onClick={btnPayAndComplete}
                className="w-full text-white btn hover:bg-restro-green-dark bg-restro-green"
              >
                Pay & Complete Hall Order
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {/* dialog: complete order & payment summary */}
    </Page>
  );
}
