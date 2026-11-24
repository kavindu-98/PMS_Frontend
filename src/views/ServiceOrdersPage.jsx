/** @format */

import React, { useContext, useEffect, useRef, useState } from "react";
import Page from "../components/Page";
import {
  cancelKitchenOrder,
  completeKitchenOrder,
  getCompleteOrderPaymentSummary,
  getOrders,
  getOrdersInit,
  payAndCompleteKitchenOrder,
  updateKitchenOrderItemStatus,
  getServiceOrders,
  payAndCompleteServiceOrder,
  getCompleteServiceOrderPaymentSummary,
} from "../controllers/orders.controller";
import { validatePromoCode } from "../controllers/pos.controller";
import { toast } from "react-hot-toast";
import {
  IconArmchair,
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
import { setDetailsForAddtionalServiceReceiptPrint } from "../helpers/ReceiptHelper";

import { SocketContext } from "../contexts/SocketContext";
import { initSocket } from "../utils/socket";
import { textToSpeech } from "../utils/textToSpeech";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
import { serialize } from "swr/_internal";

export default function ServiceOrdersPage() {
  const printReceiptRef = useRef();
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const [state, setState] = useState({
    kitchenOrders: [],
    kitchenOrdersFilter: [],
    printSettings: null,
    storeSettings: null,
    paymentTypes: [],
    isLoading: true,

    serviceOrders: [],
    groupedOrders: [],

    cancelOrderIds: [],
    completeOrderIds: [],
    completeTokenIds: "",
    isBar: "false",
    room_no: null,
    currency: null,

    summaryNetTotal: 0,
    summaryTaxTotal: 0,
    summaryTotal: 0,
    summaryDiscount: 0,
    summaryAdvanced: 0,
    summaryServiceCh: 0,
    summaryOrders: [],
    order: null,
    message: "",

    promocodeType: "",
    promocode: "",

    selectedPaymentType: null,
  });

  const [showCreditCardPopup, setShowCreditCardPopup] = useState(false); // State for credit card popup
  const [creditCardDigits, setCreditCardDigits] = useState(""); // State for credit card digits

  useEffect(() => {
    _init();
    _initSocket();
  }, []);

  const {
    kitchenOrdersFilter,
    serviceOrders,
    groupedOrders,
    kitchenOrders,
    printSettings,
    storeSettings,
    paymentTypes,
    isLoading,
    currency,
  } = state;
  const _init = async () => {
    try {
      const [ordersResponse, ordersInitResponse] = await Promise.all([
        getServiceOrders(),
        getOrdersInit(),
      ]);

      if (ordersResponse.status == 200 && ordersInitResponse.status == 200) {
        const groupedOrders = ordersResponse.data.groupedOrders || [];
        const ordersInit = ordersInitResponse.data;

        const currency = CURRENCIES.find(
          (c) => c.cc == ordersInit?.storeSettings?.currency
        );

        setState({
          ...state,
          groupedOrders,
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
      const res = await getServiceOrders();

      toast.dismiss();
      if (res.status == 200 && res.status == 200) {
        const groupedOrders = res.data.groupedOrders || [];
        toast.success("Orders Loaded!");
        console.log("get Data refresg", res.data);

        const orders = res.data || [];

        setState({
          ...state,
          groupedOrders,
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

  const btnShowPayAndComplete = async (servicesIds) => {
    console.log("servicesIds", servicesIds);
    try {
      toast.loading("Please wait...");
      const res = await getCompleteServiceOrderPaymentSummary(servicesIds);
      toast.dismiss();

      if (res.status == 200) {
        const {
          totalSubtotal,
          totalTax,
          totalAdvanceAmount,
          grandTotal,
          serviceCharge,
          additional_services: ordersArr,
        } = res.data;

        // Extract additional services from API response
        const additionalServices = ordersArr?.map((service) => ({
          tokenNo: service.token_no,
          dayOutReservationId: service.day_out_reservation_id,
          advancedAmount: service.advanced_amount,
          note: service.note,
          discount: service.discount,
          items: service?.items?.map((item) => ({
            id: item.id,
            services: item.services,
            subServices: item.sub_services,
            count: item.count,
            finalPrice: item.final_price,
            price: item.price,
            taxValue: item.tax_value,
          })),
        }));

        setState({
          ...state,
          summaryNetTotal: totalSubtotal,
          summaryTaxTotal: totalTax,
          summaryTotal: grandTotal,
          summaryAdvanced: totalAdvanceAmount,
          summaryServiceCh: serviceCharge,
          // promocodeType: orders[0].promocodeType || "",
          // promocode: orders[0].promocode || "",
          completeOrderIds: servicesIds,
          order: additionalServices,
          serviceCharge: "true",
        });

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

  const btnPayAndComplete = async () => {
    const isPrintReceipt = printReceiptRef.current.checked || false;

    try {
      toast.loading("Please wait...");

      // Ensure all required values are passed in the correct format
      const payload = {
        orderIds: state.completeOrderIds,
        subTotal: state.summaryNetTotal,
        taxTotal: state.summaryTaxTotal,
        total: state.summaryTotal,
        discount: state.summaryDiscount,
        promocodeType: state.promocodeType || null,
        promocode: state.promocode || null,
        creditCardDigits: creditCardDigits || null,
        selectedPaymentType: state.selectedPaymentType || null,
        serviceCharge: true,
      };

      console.log("Payload Sent:", payload); // Debugging line

      const res = await payAndCompleteServiceOrder(payload);

      toast.dismiss();
      if (res.status === 200) {
        sendOrderUpdateEvent();
        await refreshOrders();

        toast.success(res.data.message);
        document.getElementById("modal-order-summary-complete").close();
        setCreditCardDigits("");
        if (isPrintReceipt) {
          const orders = [];
          const orderIds = state.completeOrderIds.join(", ");

          // const paymentType = paymentTypes.find(
          //   (v) => v.id == state.selectedPaymentType
          // );
          // let paymentMethodText;
          // if (paymentType) {
          //   paymentMethodText = paymentType.title;
          // }

          setDetailsForAddtionalServiceReceiptPrint({
            serviceItems: state.order,
            // deliveryType: delivery_type,
            // customerType: customer_type,
            // customer: { id: customer_id, name: customer_name },
            currency,
            storeSettings,
            printSettings,
            // promocodeType: promoCodeTypes1,
            // promocode: promocode,
            // discount: discount,
            itemsTotal: state.summaryNetTotal,
            taxTotal: state.summaryTaxTotal,
            advanceTotal: state.summaryAdvanced,
            orderId: state.completeTokenIds,
            serviceCharge: state.summaryServiceCh,
            grandTotal: state.summaryTotal,
            // paymentMethod: paymentMethodText,
          });

          setState((prev) => ({ ...prev, selectedPaymentType: null }));

          const receiptWindow = window.open(
            "/print-additional-receipt",
            "_blank",
            "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
          );
          receiptWindow.onload = (e) => {
            setTimeout(() => {
              receiptWindow.print();
            }, 400);
          };
        }
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

  const btnPrintReceipt = async (servicesIds) => {
    console.log("orderIdsArrorderIdsArr", servicesIds);

    try {
      toast.loading("Please wait...");
      const res = await getCompleteServiceOrderPaymentSummary(servicesIds);
      toast.dismiss();
      console.log("res ", res);

      if (res.status == 200) {
        const {
          totalSubtotal,
          totalTax,
          totalAdvanceAmount,
          serviceCharge,
          grandTotal,
          additional_services: ordersArr,
        } = res.data;

        const orders = [];
        const orderIds = servicesIds.join(", ");

        // Extract additional services from API response
        const additionalServices = ordersArr?.map((service) => ({
          tokenNo: service.token_no,
          dayOutReservationId: service.day_out_reservation_id,
          advancedAmount: service.advanced_amount,
          note: service.note,
          discount: service.discount,
          items: service?.items?.map((item) => ({
            id: item.id,
            services: item.services,
            subServices: item.sub_services,
            count: item.count,
            finalPrice: item.final_price,
            price: item.price,
            taxValue: item.tax_value,
          })),
        }));

        setDetailsForAddtionalServiceReceiptPrint({
          serviceItems: additionalServices,
          // deliveryType: delivery_type,
          // customerType: customer_type,
          // customer: { id: customer_id, name: customer_name },
          currency,
          storeSettings,
          printSettings,
          itemsTotal: totalSubtotal,
          taxTotal: totalTax,
          serviceCharge: serviceCharge,
          advanceTotal: totalAdvanceAmount,
          grandTotal: grandTotal,
          orderId: orderIds,
        });

        // Open the print receipt window
        const receiptWindow = window.open(
          "/print-additional-receipt",
          "_blank",
          "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
        );

        receiptWindow.onload = (e) => {
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

  return (
    <Page>
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Ongoing Services</h3>
        <button
          onClick={refreshOrders}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
        >
          <IconRefresh size={22} stroke={iconStroke} /> Refresh
        </button>
      </div>

      {groupedOrders?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/kitchen.svg"
            alt="no orders"
            className="w-full md:w-60"
          />
          <p className="text-gray-400">No Orders Pending!</p>
        </div>
      )}

      {groupedOrders?.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {groupedOrders.map((group, groupIndex) =>
            group.tokens.map((token, tokenIndex) => {
              const { token_no, orders } = token;

              // Since payment_status is not provided in API response, we remove `isPaid`
              const order_ids = orders?.map((o) => String(o.id)); // Use `id` instead of `order_id`
              const customerName =
                orders[0]?.customer_name ?? orders[0]?.customer_type;

              return (
                <div
                  key={`${groupIndex}-${tokenIndex}`}
                  className="border border-restro-border-green-light rounded-2xl px-4 py-5 flex flex-col divide-y divide-dashed"
                >
                  <div className="flex items-center flex-col md:flex-row md:justify-between text-center gap-2 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex w-12 h-12 rounded-full items-center justify-center bg-gray-100 text-gray-400">
                        <IconReceipt size={24} stroke={iconStroke} />
                      </div>
                      <div>
                        {customerName && (
                          <p className="text-sm">{customerName}</p>
                        )}
                      </div>
                    </div>
                    <div className="dropdown dropdown-end">
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-sm btn-circle bg-transparent border-none shadow-none m-1"
                      >
                        <IconDotsVertical size={18} stroke={iconStroke} />
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                      >
                        <li>
                          <button
                            className="flex items-center gap-2 bg-transparent border-none shadow-none "
                            onClick={() => {
                              btnPrintReceipt(order_ids);
                            }}
                          >
                            <IconReceipt size={18} stroke={iconStroke} /> Print
                            Receipt
                          </button>
                        </li>
                        <li>
                          <button
                            className="flex items-center gap-2 bg-transparent border-none shadow-none text-red-500"
                            onClick={() => {
                              btnShowCancelOrderModal(order_ids);
                            }}
                          >
                            <IconX size={18} stroke={iconStroke} /> Cancel
                          </button>
                        </li>
                        <li>
                          <button
                            className="flex items-center gap-2 bg-transparent border-none shadow-none text-green-500 "
                            onClick={() => {
                              btnShowPayAndComplete(order_ids);
                            }}
                          >
                            <IconCash size={18} stroke={iconStroke} /> Pay &
                            Complete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {orders?.map((o, i) => {
                    const {
                      id,
                      tenant_id,
                      customer_id,
                      customer_type,
                      customer_name,
                      services,
                      sub_services,
                      final_price,
                      count,
                      token_no,
                      notes,
                      created_at,
                    } = o;

                    return (
                      <div className="py-2 bg-gray-50 px-2 mt-2 mb-2 rounded-xl">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center justify-center flex-col text-center">
                            <p>Token:</p>
                            <div className="w-12 h-12 flex items-center justify-center font-bold rounded-full bg-slate-700 text-white">
                              {token_no}
                            </div>
                          </div>
                          <div className="text-end">
                            <p>
                              {new Intl.DateTimeFormat("en-US", {
                                timeStyle: "short",
                              }).format(new Date(created_at))}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col divide-y">
                          <div className="flex items-center gap-2 py-2">
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
                          </div>
                        </div>
                        {/* order items */}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      <dialog id="modal-order-cancel" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Alert!</h3>
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
                className="ml-2 btn hover:bg-red-700 bg-red-500 text-white"
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
          <h3 className="font-bold text-lg">Alert!</h3>
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
                className="ml-2 btn hover:bg-restro-green-dark bg-restro-green text-white"
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
          <h3 className="font-bold text-lg">
            Enter Last 4 Digits of Credit Card
          </h3>
          <input
            type="text"
            maxLength={4}
            value={creditCardDigits || ""}
            onChange={handleSaveCreditCardDetails}
            placeholder="Enter last 4 digits"
            className="w-full border rounded-lg px-4 py-2 my-4 bg-gray-50 text-gray-500 focus:outline-restro-border-green-light"
          />
          <div className="modal-action">
            <button
              onClick={() =>
                document.getElementById("modal-credit-card-details").close()
              }
              className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Add save logic here
                document.getElementById("modal-credit-card-details").close();
                toast.success("Credit Card Details Saved!");
              }}
              className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>

      {/* dialog: complete order & payment summary */}
      <dialog
        id="modal-order-summary-complete"
        className=" modal modal-bottom sm:modal-middle "
      >
        <div className="modal-box">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              Pay & Complete Addtional Services Order!
            </h3>
            <form method="dialog">
              <button
                className="hover:bg-red-100 border-none transition active:scale-95 bg-red-50 text-red-500 btn btn-sm btn-circle"
                onClick={closeModal}
              >
                <IconX size={18} stroke={iconStroke} />
              </button>
            </form>
          </div>

          <div className="my-6">
            <div className="flex w-full items-center divide-x gap-x-3">
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
              {state.summaryServiceCh > 0 && (
                <div className="flex-1 text-center">
                  <p>Service Charge </p>
                  <p className="text-l">
                    {currency}
                    {Number(state.summaryServiceCh).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex-1 text-center">
                <p>Total</p>
                <p className="text-2xl text-restro-green font-bold">
                  {currency}
                  {Number(state.summaryTotal).toFixed(2)}
                </p>
              </div>
            </div>

            <label
              htmlFor="print_receipt"
              className="mt-4 w-full flex justify-end items-center gap-2 "
            >
              <input
                type="checkbox"
                className="checkbox"
                id="print_receipt"
                ref={printReceiptRef}
              />{" "}
              Print Receipt?
            </label>
          </div>

          {state.promocodeType && state.promocode && (
            <>
              <div className="flex flex-col gap-2 mb-4">
                <label
                  htmlFor="promoCodeType"
                  className="mb-1 block text-gray-500 text-sm"
                >
                  Select Promo Code Type:
                </label>
                <select
                  value={state.promocodeType || ""}
                  disabled
                  className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
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
                  className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-500 focus:outline-restro-border-green-light"
                  value={state.promocode || ""}
                  disabled
                />
              </div>
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
                    className="peer hidden"
                  />
                  <label
                    htmlFor={paymentType?.icon}
                    className="border rounded-2xl flex items-center justify-center gap-1 flex-col px-4 py-3 text-gray-500 peer-checked:border-restro-green peer-checked:text-restro-green peer-checked:font-bold cursor-pointer transition"
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
                  btnPayAndComplete();
                }}
                className="w-full btn hover:bg-restro-green-dark bg-restro-green text-white"
              >
                Pay & Complete Order
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: complete order & payment summary */}
    </Page>
  );
}
