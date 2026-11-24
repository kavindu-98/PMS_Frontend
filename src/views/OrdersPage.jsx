/** @format */

import React, { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Page from "../components/Page";
import {
  cancelKitchenOrder,
  completeKitchenOrder,
  getCompleteOrderPaymentSummary,
  getInvoiceIdFromOrderId,
  getOrders,
  getOrdersInit,
  payAndCompleteKitchenOrder,
  updateKitchenOrderItemStatus,
} from "../controllers/orders.controller";
import { toast } from "react-hot-toast";
import {
  IconArmchair,
  IconBoxSeam,
  IconCash,
  IconCheck,
  IconChecks,
  IconClock,
  IconDotsVertical,
  IconExternalLink,
  IconReceipt,
  IconRefresh,
  IconStars,
  IconX,
  IconKeyboard,
} from "@tabler/icons-react";
import {
  FRONTEND_DOMAIN,
  VITE_BACKEND_SOCKET_IO,
  iconStroke,
} from "../config/config";
import { CURRENCIES } from "../config/currencies.config";
import { PAYMENT_ICONS } from "../config/payment_icons";
import { setDetailsForReceiptPrint } from "../helpers/ReceiptHelper";

import { SocketContext } from "../contexts/SocketContext";
import { initSocket } from "../utils/socket";
import { textToSpeech } from "../utils/textToSpeech";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";
import QRCode from "qrcode";
import { getQRMenuLink } from "../helpers/QRMenuHelper";
import { useTheme } from "../contexts/ThemeContext";
import clsx from "clsx";

export default function OrdersPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const printReceiptRef = useRef();
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const [state, setState] = useState({
    kitchenOrders: [],
    printSettings: null,
    storeSettings: null,
    paymentTypes: [],
    isLoading: true,

    cancelOrderIds: [],
    completeOrderIds: [],
    completeTokenIds: "",

    currency: null,

    summaryNetTotal: 0,
    summaryTaxTotal: 0,
    summaryServiceChargeTotal: 0,
    summaryTotal: 0,
    summaryOrders: [],
    order: null,

    selectedPaymentType: null,

    // Payment handling state
    paidAmount: 0,
    balance: 0,
    showVirtualKeyboard: false,

    feedbackInvoiceId: null,
    feedbackCustomerId: null,
    feedbackQRCode: null,
    selectedPayments: {},
  });
  const [activePaymentId, setActivePaymentId] = useState(null);
  useEffect(() => {
    _init();
    _initSocket();

    return () => {
      // socket.disconnect()
      socket.off("new_order");
      socket.off("order_update");
    };
  }, []);
  useEffect(() => {
    const completeDialog = document.getElementById(
      "modal-order-summary-complete"
    );

    const handleClose = () => {
      // Clear all payment-related state when modal closes
      setState((prev) => ({
        ...prev,
        selectedPayments: {},
        paidAmount: 0,
        balance: 0,
        showVirtualKeyboard: false,
      }));
      setActivePaymentId(null);
    };

    if (completeDialog) {
      completeDialog.addEventListener("close", handleClose);
    }

    return () => {
      if (completeDialog) {
        completeDialog.removeEventListener("close", handleClose);
      }
    };
  }, []);
  useEffect(() => {
    const completeDialog = document.getElementById(
      "modal-order-summary-complete"
    );
    if (!completeDialog) return;

    completeDialog.addEventListener("close", resetPaymentState);
    completeDialog.addEventListener("cancel", resetPaymentState);

    return () => {
      completeDialog.removeEventListener("close", resetPaymentState);
      completeDialog.removeEventListener("cancel", resetPaymentState);
    };
  }, []);

  const {
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
        getOrders(),
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
          kitchenOrders: orders,
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
      toast.loading(t("orders.loading_message"));
      const res = await getOrders();
      toast.dismiss();
      if (res.status == 200) {
        toast.success(t("orders.orders_loaded"));
        setState({
          ...state,
          kitchenOrders: res.data,
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
    return <Page>{t("orders.loading_message")}</Page>;
  }

  const btnChangeOrderItemStatus = async (orderItemId, status) => {
    try {
      toast.loading(t("orders.loading_message"));
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

  const btnShowCancelOrderModal = (orderIds) => {
    setState({
      ...state,
      cancelOrderIds: orderIds,
    });
    document.getElementById("modal-order-cancel").showModal();
  };
  const btnCancelOrder = async () => {
    try {
      toast.loading(t("orders.loading_message"));
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

  const btnShowCompleteOrderModal = (orderIds) => {
    setState({
      ...state,
      completeOrderIds: orderIds,
    });
    document.getElementById("modal-order-complete").showModal();
  };
  const btnCompleteOrder = async () => {
    try {
      toast.loading(t("orders.loading_message"));
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

  const btnShowPayAndComplete = async (orderIds, order) => {
    try {
      toast.loading(t("orders.loading_message"));
      const res = await getCompleteOrderPaymentSummary(orderIds);
      toast.dismiss();

      if (res.status == 200) {
        const { subtotal, taxTotal, serviceChargeTotal, total, orders } =
          res.data;

        // Check if delivery type is delivery or takeaway - exclude service charge
        const deliveryType = orders[0]?.delivery_type;
        const finalServiceChargeTotal =
          deliveryType === "delivery" || deliveryType === "takeaway"
            ? 0
            : serviceChargeTotal;
        const finalTotal = subtotal + taxTotal + finalServiceChargeTotal;

        const tokenNoArray = orders.map((o) => o.token_no);
        const tokens = tokenNoArray.join(",");

        setState({
          ...state,
          summaryNetTotal: subtotal,
          summaryTaxTotal: taxTotal,
          summaryServiceChargeTotal: finalServiceChargeTotal,
          summaryTotal: finalTotal,
          summaryOrders: orders,
          completeOrderIds: orderIds,
          completeTokenIds: tokens,
          order: order,
          // Reset payment state
          paidAmount: 0,
          balance: -finalTotal, // Negative balance initially (amount owed)
          showVirtualKeyboard: false,
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

  // Payment handling functions
  const calculateBalance = (paid, total) => {
    return paid - total; // Shows change/overpayment amount
  };

  const handlePaidAmountChange = (amount) => {
    const paid = parseFloat(amount) || 0;
    const balance = calculateBalance(paid, state.summaryTotal);
    setState({
      ...state,
      paidAmount: paid,
      balance: balance,
    });
  };

  const handleMoneyButtonClick = (amount) => {
    const newPaidAmount = state.paidAmount + amount;
    handlePaidAmountChange(newPaidAmount);
  };

  const toggleVirtualKeyboard = () => {
    const dialog = document.getElementById("modal-virtual-keyboard-orders");

    if (state.showVirtualKeyboard) {
      dialog.close();

      // 🧹 Clear current active input when closing
      if (activePaymentId) {
        setState((prev) => {
          const newPayments = { ...prev.selectedPayments };
          newPayments[activePaymentId] = 0; // reset to 0 or "" if you prefer empty
          return { ...prev, selectedPayments: newPayments };
        });
      }

      setState((prev) => ({ ...prev, showVirtualKeyboard: false }));
      setActivePaymentId(null);
    } else {
      dialog.showModal();
      setState((prev) => ({ ...prev, showVirtualKeyboard: true }));
    }
  };

  const handleVirtualKeyboardInput = (value) => {
    if (!activePaymentId) return;

    let currentAmount =
      state.selectedPayments[activePaymentId]?.toString() || "";

    if (value === "C" || value === "clear") {
      currentAmount = "";
    } else if (value === "backspace") {
      currentAmount = currentAmount.slice(0, -1);
    } else if (value === "enter") {
      document.getElementById("modal-virtual-keyboard-orders").close();
      setState((prev) => ({ ...prev, showVirtualKeyboard: false }));
      setActivePaymentId(null);
      return;
    } else {
      currentAmount += value;
    }

    setState((prev) => ({
      ...prev,
      selectedPayments: {
        ...prev.selectedPayments,
        [activePaymentId]: parseFloat(currentAmount) || 0,
      },
    }));
  };

  const btnPayAndComplete = async () => {
    const isPrintReceipt = printReceiptRef.current.checked || false;

    if (
      !state.selectedPayments ||
      Object.keys(state.selectedPayments).length === 0
    ) {
      return toast.error(t("orders.select_payment_method"));
    }
    // Clone selected payments
    let paymentsToSend = { ...state.selectedPayments };
    let rawPayments = { ...state.selectedPayments };

    paymentsToSend = adjustCashPayment(paymentsToSend, state.summaryTotal);

    const totalPaidRaw = Object.values(state.selectedPayments).reduce(
      (sum, amt) => sum + (parseFloat(amt) || 0),
      0
    );
    const rawBalance = totalPaidRaw - state.summaryTotal;

    const totalPaid = Object.values(paymentsToSend).reduce(
      (sum, amt) => sum + (parseFloat(amt) || 0),
      0
    );

    if (totalPaid < state.summaryTotal) {
      return toast.error(t("pos.insufficient_payment"));
    }
    // Check if payment is sufficient (only for Cash payments)
    const selectedPaymentType = paymentTypes.find(
      (p) => p.id == state.selectedPaymentType
    );
    if (
      selectedPaymentType?.title?.toLowerCase() === "cash" &&
      state.paidAmount < state.summaryTotal
    ) {
      return toast.error(t("pos.insufficient_payment"));
    }
    try {
      toast.loading(t("orders.loading_message"));
      const res = await payAndCompleteKitchenOrder(
        state.completeOrderIds,
        state.summaryNetTotal,
        state.summaryTaxTotal,
        state.summaryServiceChargeTotal,
        state.summaryTotal,
        paymentsToSend
      );
      toast.dismiss();
      if (res.status == 200) {
        const invoiceId = res.data?.invoiceId || null;
        const customerId = res.data?.customerId || null;
        const ne_invoiceId = res.data?.ne_invoiceId || null;

        sendOrderUpdateEvent();
        await refreshOrders();
        toast.success(res.data.message);
        document.getElementById("modal-order-summary-complete").close();
        resetPaymentState();
        if (isPrintReceipt) {
          const { table_id, table_title, floor } = state.order;

          const orders = [];
          const orderIds = state.completeOrderIds.join(", ");

          for (const o of state.summaryOrders) {
            const items = o.items;
            items.forEach((i) => {
              const usePrice = i.variant_id
                ? parseFloat(i.variant_price)
                : parseFloat(i.price);

              const variant = i.variant_id
                ? {
                    id: i.variant_id,
                    title: i.variant_title,
                    price: parseFloat(i.variant_price),
                  }
                : null;

              orders.push({
                ...i,
                title: i.item_title,
                price: usePrice,
                addons_ids:
                  i?.addons?.length > 0 ? i?.addons?.map((a) => a.id) : [],
                variant,
              });
            });
          }

          const {
            customer_id,
            cashier,
            customer_type,
            customer_name,
            date,
            delivery_type,
          } = state.summaryOrders[0];

          const paymentType = paymentTypes.find(
            (v) => v.id == state.selectedPaymentType
          );
          let paymentMethodText;
          if (paymentType) {
            paymentMethodText = paymentType.title;
          }
          // Map payment IDs to names for printing
          const paymentDetailsForPrint = Object.entries(paymentsToSend).map(
            ([id, amount]) => {
              const pt = paymentTypes.find((p) => String(p.id) === String(id));
              return {
                id,
                title: pt ? pt.title : `Payment ${id}`,
                amount: parseFloat(amount) || 0,
              };
            }
          );
          // Always calculate from selectedPayments
          const totalPaidForPrint = Object.values(
            state.selectedPayments || {}
          ).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
          const balanceForPrint = totalPaidForPrint - state.summaryTotal;
          setDetailsForReceiptPrint({
            cartItems: orders,
            deliveryType: delivery_type,
            customerType: customer_type,
            customer: { id: customer_id, name: customer_name, cashier },
            tableId: table_id,
            currency,
            storeSettings,
            printSettings,
            itemsTotal: state.summaryNetTotal,
            taxTotal: state.summaryTaxTotal,
            serviceChargeTotal: state.summaryServiceChargeTotal,
            payableTotal: state.summaryTotal,
            tokenNo: state.completeTokenIds,
            orderId: orderIds,
            paymentMethod: paymentMethodText,
            paidAmount: state.paidAmount,
            balance: state.balance,
            invoiceId: ne_invoiceId,
            payments: paymentDetailsForPrint,
            rawPayments: rawPayments,
            rawBalance: rawBalance,
            paidAmount: totalPaidForPrint,
            balance: balanceForPrint,
            cashierName: cashier || "",
          });

          const receiptWindow = window.open(
            "/print-receipt",
            "_blank",
            "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
          );
          receiptWindow.onload = (e) => {
            setTimeout(() => {
              receiptWindow.print();
            }, 400);
          };
        }

        // Feedback
        const link =
          getQRMenuLink(storeSettings?.unique_qr_code) +
          `/feedback?_ref=${invoiceId}${
            customerId ? `&_cref=${customerId}` : ""
          }`;

        const qrDataURL = await QRCode.toDataURL(link, { width: 1080 });

        if (storeSettings?.is_feedback_enabled) {
          document.getElementById("modal-collect-feedback").showModal();
        }

        setState((prev) => ({
          ...prev,
          selectedPaymentType: null,
          feedbackInvoiceId: invoiceId,
          feedbackCustomerId: customerId,
          feedbackQRCode: qrDataURL,
        }));
        // Feedback
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

  const btnPrintReceipt = async (orderIdsArr, tokens) => {
    try {
      toast.loading(t("orders.loading_message"));
      const res = await getCompleteOrderPaymentSummary(orderIdsArr);
      toast.dismiss();

      if (res.status == 200) {
        const {
          subtotal,
          taxTotal,
          serviceChargeTotal,
          total,
          orders: ordersArr,
          invoiceId,
        } = res.data;

        // Check if delivery type is delivery or takeaway - exclude service charge
        const deliveryType = ordersArr[0]?.delivery_type;
        const finalServiceChargeTotal =
          deliveryType === "delivery" || deliveryType === "takeaway"
            ? 0
            : serviceChargeTotal;
        const finalTotal = subtotal + taxTotal + finalServiceChargeTotal;

        const orders = [];
        const orderIds = orderIdsArr.join(", ");

        for (const o of ordersArr) {
          const items = o.items;
          items.forEach((i) => {
            const usePrice = i.variant_id
              ? parseFloat(i.variant_price)
              : parseFloat(i.price);

            const variant = i.variant_id
              ? {
                  id: i.variant_id,
                  title: i.variant_title,
                  price: parseFloat(i.variant_price),
                }
              : null;

            orders.push({
              ...i,
              title: i.item_title,
              price: usePrice,
              addons_ids:
                i?.addons?.length > 0 ? i?.addons?.map((a) => a.id) : [],
              variant,
            });
          });
        }

        const {
          customer_id,
          cashier,
          customer_type,
          customer_name,
          date,
          delivery_type,
        } = ordersArr[0];
        console.log("Recipt NO IS:", invoiceId);
        setDetailsForReceiptPrint({
          cartItems: orders,
          deliveryType: delivery_type,
          customerType: customer_type,
          customer: { id: customer_id, name: customer_name, cashier },
          tableId: null,
          currency,
          storeSettings,
          printSettings,
          itemsTotal: subtotal,
          taxTotal: taxTotal,
          serviceChargeTotal: finalServiceChargeTotal,
          payableTotal: finalTotal,
          tokenNo: tokens,
          orderId: orderIds,
          invoiceId: invoiceId,
          cashierName: cashier || "",
        });

        const receiptWindow = window.open(
          "/print-receipt",
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
  const resetPaymentState = () => {
    setState((prev) => ({
      ...prev,
      selectedPayments: {},
      paidAmount: 0,
      balance: 0,
      showVirtualKeyboard: false,
    }));
    setActivePaymentId(null);
  };

  const btnCollectFeedback = async (orderIdsArr) => {
    try {
      toast.loading(t("orders.loading_message"));
      const res = await getInvoiceIdFromOrderId(orderIdsArr);
      toast.dismiss();

      if (res.status == 200) {
        const { invoiceId, customerId } = res.data;

        if (!invoiceId) {
          toast.error("Please finish the order to collect feedback!");
          return;
        }

        const link =
          getQRMenuLink(storeSettings?.unique_qr_code) +
          `/feedback?_ref=${invoiceId}${
            customerId ? `&_cref=${customerId}` : ""
          }`;

        const qrDataURL = await QRCode.toDataURL(link, { width: 1080 });

        setState({
          ...state,
          feedbackInvoiceId: invoiceId,
          feedbackCustomerId: customerId,
          feedbackQRCode: qrDataURL,
        });

        document.getElementById("modal-collect-feedback").showModal();
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

  const btnOpenFeedbackLink = () => {
    const a = document.createElement("a");
    a.href =
      getQRMenuLink(storeSettings?.unique_qr_code) +
      `/feedback?_ref=${state.feedbackInvoiceId}${
        state.feedbackCustomerId ? `&_cref=${state.feedbackCustomerId}` : ""
      }`;
    a.target = "_blank";
    a.click();
    a.remove();

    document.getElementById("modal-collect-feedback").close();
  };

  const totalPaid = Object.values(state.selectedPayments || {}).reduce(
    (sum, amt) => sum + (parseFloat(amt) || 0),
    0
  );
  const balance = totalPaid - state.summaryTotal;

  // Utility: auto-adjust cash payment
  const adjustCashPayment = (payments, billTotal) => {
    let totalPaid = Object.values(payments).reduce(
      (sum, amt) => sum + (parseFloat(amt) || 0),
      0
    );

    if (totalPaid > billTotal) {
      const cashType = state.paymentTypes.find(
        (p) => p.title.toLowerCase() === "cash"
      );
      if (cashType && payments[cashType.id] !== undefined) {
        const overPayment = totalPaid - billTotal;

        // Deduct overpayment from cash only
        payments[cashType.id] = Math.max(
          0,
          (parseFloat(payments[cashType.id]) || 0) - overPayment
        );
      }
    }

    return payments;
  };

  const isCashMethod = (paymentType) =>
    paymentType.title.toLowerCase() === "cash";

  return (
    <Page>
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">{t("orders.title")}</h3>
        <button
          onClick={refreshOrders}
          className="flex items-center gap-1 rounded-xl text-restro-text shadow-none transition active:scale-95 px-2 py-1 bg-restro-gray hover:bg-restro-button-hover border border-restro-border-green"
        >
          <IconRefresh size={22} stroke={iconStroke} /> {t("orders.refresh")}
        </button>
      </div>

      {kitchenOrders?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/orders-not-found.webp"
            alt={t("orders.no_orders_img_alt")}
            className="w-1/2 md:w-60"
          />
          <p className="text-gray-400">{t("orders.no_orders")}</p>
        </div>
      )}

      {kitchenOrders?.length > 0 && (
        <div
          className={`mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 `}
        >
          {kitchenOrders.map((order, index) => {
            const { table_id, table_title, floor, orders, order_ids } = order;

            const tokenNoArray = orders.map((o) => o.token_no);
            const tokens = tokenNoArray.join(",");

            const isPaid = orders.every((o) => o.payment_status == "paid");

            return (
              <div
                key={index}
                className="flex flex-col divide-y divide-dashed divide-gray-200 dark:divide-gray-700 px-4 py-5 border rounded-2xl border-restro-border-green"
              >
                <div className="flex md:items-center flex-col md:flex-row md:justify-between md:text-center gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex w-12 h-12 rounded-full items-center justify-center bg-restro-gray">
                      {table_id ? (
                        <IconArmchair size={24} stroke={iconStroke} />
                      ) : (
                        <IconReceipt size={24} stroke={iconStroke} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">
                        {table_id ? `${table_title}` : "Dine Out / Delivery"}
                      </p>
                      {floor && <p className="text-sm">{floor}</p>}
                    </div>
                  </div>
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="m-1 btn btn-sm btn-circle bg-transparent border-none shadow-none p-2 rounded-full hover:bg-restro-button-hover"
                    >
                      <IconDotsVertical size={18} stroke={iconStroke} />
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-lg w-52 border border-restro-border-green "
                    >
                      <li>
                        <button
                          className="flex items-center gap-2 bg-transparent border-none shadow-none "
                          onClick={() => {
                            btnPrintReceipt(order_ids, tokens);
                          }}
                        >
                          <IconReceipt size={18} stroke={iconStroke} />{" "}
                          {t("orders.print_receipt")}
                        </button>
                      </li>
                      {storeSettings?.is_feedback_enabled ? (
                        <li>
                          <button
                            className="flex items-center gap-2 bg-transparent border-none shadow-none "
                            onClick={() => {
                              btnCollectFeedback(order_ids);
                            }}
                          >
                            <IconStars size={18} stroke={iconStroke} />{" "}
                            {t("orders.collect_feedback")}
                          </button>
                        </li>
                      ) : (
                        <></>
                      )}
                      <li>
                        <button
                          className="flex items-center gap-2 bg-transparent border-none shadow-none text-restro-red"
                          onClick={() => {
                            btnShowCancelOrderModal(order_ids);
                          }}
                        >
                          <IconX size={18} stroke={iconStroke} />{" "}
                          {t("orders.cancel")}
                        </button>
                      </li>
                      <li>
                        <button
                          className="flex items-center gap-2 bg-transparent border-none shadow-none text-restro-green"
                          onClick={() => {
                            if (isPaid == false) {
                              toast.error(
                                t("orders.payment_not_collected_error")
                              );
                              return;
                            }
                            btnShowCompleteOrderModal(order_ids);
                          }}
                        >
                          <IconCheck size={18} stroke={iconStroke} />{" "}
                          {t("orders.complete")}
                        </button>
                      </li>
                      <li>
                        <button
                          className="flex items-center gap-2 bg-transparent border-none shadow-none "
                          onClick={() => {
                            if (isPaid == true) {
                              toast.error(
                                t("orders.payment_already_collected_error")
                              );
                              return;
                            }
                            btnShowPayAndComplete(order_ids, order);
                          }}
                        >
                          <IconCash size={18} stroke={iconStroke} />{" "}
                          {t("orders.pay_complete")}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {orders.map((o, i) => {
                  const {
                    id,
                    date,
                    delivery_type,
                    customer_type,
                    customer_id,
                    cashier,
                    customer_name,
                    status,
                    payment_status,
                    token_no,
                    items,
                  } = o;

                  return (
                    <div
                      className="py-2 px-2 mt-2 mb-2 rounded-xl bg-gray-50 dark:bg-restro-gray"
                      key={i}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center justify-center flex-col text-center">
                          <p>{t("orders.token")}</p>
                          <div className="w-12 h-12 flex items-center justify-center font-bold rounded-full bg-gray-700 dark:bg-[#0a0a0a] text-white">
                            {token_no}
                          </div>
                        </div>
                        <div className="text-end">
                          <p>
                            {new Intl.DateTimeFormat("en-US", {
                              timeStyle: "short",
                            }).format(new Date(date))}
                          </p>
                          <p
                            className={clsx("flex gap-2 items-center text-sm", {
                              "text-amber-500": payment_status == "pending",
                              "text-restro-green": payment_status == "paid",
                            })}
                          >
                            {" "}
                            <IconCash stroke={iconStroke} size={18} />{" "}
                            {payment_status.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* order items */}
                      <div className="mt-4 flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => {
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
                              ? addons?.map((a) => a.title)?.join(", ")
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
                                  className="text-restro-yellow"
                                />
                              )}
                              {status == "completed" && (
                                <IconCheck
                                  stroke={iconStroke}
                                  className="text-restro-green"
                                />
                              )}
                              {status == "cancelled" && (
                                <IconX
                                  stroke={iconStroke}
                                  className="text-restro-red"
                                />
                              )}
                              {status == "delivered" && (
                                <IconChecks
                                  stroke={iconStroke}
                                  className="text-restro-green"
                                />
                              )}
                              {/* status */}

                              {/* item title */}
                              <div className="flex-1">
                                <p>
                                  {item_title} {variant_title} x {quantity}
                                </p>
                                {addonsText && (
                                  <p className="text-sm text-gray-700 dark:text-white">
                                    Addons: {addonsText}
                                  </p>
                                )}
                                {notes && (
                                  <p className="text-sm text-gray-700 dark:text-white">
                                    Notes: {notes}
                                  </p>
                                )}
                              </div>
                              {/* item title */}

                              {/* action */}
                              <div className="dropdown dropdown-left">
                                <div
                                  tabIndex={0}
                                  role="button"
                                  className="btn btn-sm btn-circle bg-transparent border-none shadow-none m-1"
                                >
                                  <IconDotsVertical
                                    size={18}
                                    stroke={iconStroke}
                                  />
                                </div>
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 w-52 rounded-lg border border-restro-border-green"
                                >
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none text-restro-yellow"
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
                                      {t("orders.preparing")}
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
                                      {t("orders.completed")}
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
                                      {t("orders.delivered")}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="flex items-center gap-2 bg-transparent border-none shadow-none text-restro-red"
                                      onClick={() => {
                                        btnChangeOrderItemStatus(
                                          orderItemId,
                                          "cancelled"
                                        );
                                      }}
                                    >
                                      <IconX size={18} stroke={iconStroke} />{" "}
                                      {t("orders.cancelled")}
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
        <div className="modal-box border border-restro-border-green rounded-2xl">
          <h3 className="font-bold text-lg">{t("orders.success")}</h3>
          <p className="py-4">{t("orders.order_item_status_success")}</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn transition active:scale-95 hover:shadow-lg px-4 py-3 border border-restro-border-green rounded-xl dark:hover:border-restro-gray">
                {t("orders.close")}
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: successful order item status update */}

      {/* dialog: cancel order */}
      <dialog id="modal-order-cancel" className="modal">
        <div className="modal-box border border-restro-border-green rounded-2xl ">
          <h3 className="font-bold text-lg">{t("orders.alert")}</h3>
          <p className="py-4">{t("orders.cancel_order_alert")}</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn transition active:scale-95 hover:shadow-lg px-4 py-3 border border-restro-border-green rounded-xl bg-restro-gray hover:bg-restro-button-hover">
                {t("orders.dismiss")}
              </button>
              <button
                onClick={() => {
                  btnCancelOrder();
                }}
                className={`ml-2 btn bg-restro-red text-white hover:bg-red-500 transition active:scale-95 px-4 py-3 rounded-xl border-restro-red hover:border-red-600`}
              >
                {t("orders.confirm")}
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: cancel order */}

      {/* dialog: complete order */}
      <dialog id="modal-order-complete" className="modal">
        <div className="modal-box border border-restro-border-green rounded-2xl ">
          <h3 className="font-bold text-lg">{t("orders.alert")}</h3>
          <p className="py-4">{t("orders.complete_order_alert")}</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn border-restro-gray bg-restro-gray rounded-xl hover:bg-restro-button-hover">
                {t("orders.dismiss")}
              </button>
              <button
                onClick={() => {
                  btnCompleteOrder();
                }}
                className="ml-2 btn bg-restro-green border-restro-green-light hover:bg-restro-green-button-hover rounded-xl"
              >
                {t("orders.confirm")}
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: complete order */}

      {/* dialog: complete order & payment summary */}
      <dialog id="modal-order-summary-complete" className="modal">
        <div className="modal-box border border-restro-border-green rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {t("orders.pay_complete_order")}
            </h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle text-restro-red border-none transition active:scale-95 hover:bg-restro-gray">
                <IconX size={18} stroke={iconStroke} />
              </button>
            </form>
          </div>

          {/* Totals */}
          <div className="my-6">
            <div className="my-8 space-y-4 px-1">
              {[
                {
                  label: t("orders.items_net_total"),
                  value: state.summaryNetTotal,
                },
                {
                  label: t("orders.tax_total"),
                  value: state.summaryTaxTotal,
                  prefix: "+",
                },
                ...(state.summaryOrders?.[0]?.delivery_type === "dinein"
                  ? [
                      {
                        label: t("orders.service_charge_total"),
                        value: state.summaryServiceChargeTotal,
                        prefix: "+",
                      },
                    ]
                  : []),
              ].map(({ label, value, prefix = "" }, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-restro-text"
                >
                  <p>{label}</p>
                  <p className="text-lg">
                    {prefix}
                    {state.currency}
                    {value.toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-gray-300 dark:border-restro-bg-gray pt-2 mt-2">
                <p className="text-xl font-medium">
                  {t("orders.payable_total")}
                </p>
                <p className="text-xl font-bold text-restro-green">
                  {state.currency}
                  {state.summaryTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Multi-payment selection */}
            <div className="space-y-4 mt-6">
              {paymentTypes.map((paymentType) => {
                const currentAmount =
                  state.selectedPayments?.[paymentType.id] || "";
                return (
                  <div
                    key={paymentType.id}
                    className="flex items-center justify-between border p-2 rounded-lg"
                  >
                    {/* Checkbox + label */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={state.selectedPayments?.hasOwnProperty(
                          paymentType.id
                        )}
                        onChange={(e) => {
                          setState((prev) => {
                            let newPayments = { ...prev.selectedPayments };
                            if (e.target.checked) {
                              newPayments[paymentType.id] = 0;
                            } else {
                              delete newPayments[paymentType.id];
                            }
                            return { ...prev, selectedPayments: newPayments };
                          });
                        }}
                      />
                      <span>{paymentType.title}</span>
                    </label>

                    {/* Input amount if selected */}
                    {state.selectedPayments?.hasOwnProperty(paymentType.id) && (
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            className="w-28 border rounded px-2 py-1"
                            placeholder="0.00"
                            value={currentAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setState((prev) => ({
                                ...prev,
                                selectedPayments: {
                                  ...prev.selectedPayments,
                                  [paymentType.id]: val,
                                },
                              }));
                            }}
                          />

                          {/* Keyboard button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActivePaymentId(paymentType.id);
                              toggleVirtualKeyboard();
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-restro-green"
                          >
                            <IconKeyboard size={20} />
                          </button>
                        </div>

                        {/* Quick amount buttons */}
                        <div className="flex gap-1 flex-wrap">
                          {[50, 100, 500, 1000, 5000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className="px-2 py-1 text-sm bg-restro-gray hover:bg-restro-button-hover rounded"
                              onClick={() => {
                                setState((prev) => ({
                                  ...prev,
                                  selectedPayments: {
                                    ...prev.selectedPayments,
                                    [paymentType.id]:
                                      (parseFloat(
                                        prev.selectedPayments[paymentType.id]
                                      ) || 0) + amt,
                                  },
                                }));
                              }}
                            >
                              +{amt}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="px-2 py-1 text-sm bg-red-200 hover:bg-red-300 rounded"
                            onClick={() => {
                              setState((prev) => {
                                const newPayments = {
                                  ...prev.selectedPayments,
                                };
                                newPayments[paymentType.id] = 0;
                                return {
                                  ...prev,
                                  selectedPayments: newPayments,
                                };
                              });
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals from selectedPayments */}
            {(() => {
              const totalPaid = Object.values(
                state.selectedPayments || {}
              ).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
              const balance = totalPaid - state.summaryTotal;

              return (
                <div className="mt-6 space-y-2 border-t pt-2">
                  <div className="flex justify-between">
                    <p>Total Paid</p>
                    <p>
                      {state.currency}
                      {totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between font-bold">
                    <p>Balance</p>
                    <p
                      className={
                        balance >= 0 ? "text-green-500" : "text-red-500"
                      }
                    >
                      {state.currency}
                      {balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Print receipt option */}
          <label
            htmlFor="print_receipt"
            className="mt-4 w-full flex justify-end items-center gap-2"
          >
            <input
              type="checkbox"
              className="checkbox rounded-lg"
              id="print_receipt"
              ref={printReceiptRef}
            />
            {t("orders.print_receipt_option")}
          </label>

          {/* Pay button */}
          <div className="modal-action">
            <button
              onClick={() => btnPayAndComplete()}
              className="w-full rounded-xl transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green hover:bg-restro-green-button-hover text-white"
            >
              {t("orders.pay_complete_order")}
            </button>
          </div>
        </div>
      </dialog>

      {/* dialog: complete order & payment summary */}

      {/* dialog: complete order */}
      <dialog id="modal-collect-feedback" className="modal">
        <div className="modal-box border border-restro-border-green rounded-2xl ">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-restro-gray">
            <IconStars stroke={iconStroke} />
          </div>
          <h3 className="mt-4 font-bold text-lg text-center">
            {t("orders.collect_feedback")}
          </h3>

          <div className="absolute top-6 right-6">
            <form method="dialog">
              <button className="btn btn-sm btn-circle border-none transition active:scale-95 text-restro-red hover:bg-restro-button-hover">
                <IconX stroke={iconStroke} size={18} />
              </button>
            </form>
          </div>

          <div className="my-4">
            <img
              src={state.feedbackQRCode}
              alt={t("orders.feedback_qr_img_alt")}
              className="w-52 h-52 mx-auto border rounded-lg"
            />
          </div>

          <p
            className="text-center italic mb-10"
            dangerouslySetInnerHTML={{ __html: t("orders.feedback_message") }}
          ></p>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 border-b border-restro-gray"></div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-restro-gray">
              OR
            </div>
            <div className="flex-1 border-b border-restro-gray"></div>
          </div>

          <div className="modal-action justify-center">
            <form method="dialog">
              <button
                onClick={() => {
                  btnOpenFeedbackLink();
                }}
                className="btn ml-2 transition active:scale-95 hover:shadow-lg px-4 py-3 border bg-restro-green hover:bg-restro-green-button-hover text-white rounded-xl"
              >
                {t("orders.open_in_new_tab")}{" "}
                <IconExternalLink stroke={iconStroke} />
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: complete order */}

      {/* dialog: virtual keyboard for orders */}
      <dialog
        id="modal-virtual-keyboard-orders"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box border border-restro-border-green dark:rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Enter Amount</h3>
            <button
              onClick={toggleVirtualKeyboard}
              className="text-red-500 p-2 rounded-full bg-restro-gray hover:bg-restro-button-hover"
            >
              <IconX size={18} stroke={iconStroke} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Display current amount */}
            <div className="text-center">
              <p className="text-2xl font-bold text-restro-green">
                {currency}
                {activePaymentId
                  ? (state.selectedPayments[activePaymentId] || 0).toFixed(2)
                  : state.paidAmount.toFixed(2)}
              </p>
            </div>

            {/* Virtual Keyboard */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "C"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleVirtualKeyboardInput(key.toString())}
                  className={`px-4 py-3 text-lg font-medium rounded-lg transition active:scale-95 ${
                    key === "C"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-restro-gray text-restro-text hover:bg-restro-button-hover"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleVirtualKeyboardInput("backspace")}
                className="flex-1 px-4 py-3 text-lg font-medium bg-restro-gray text-restro-text hover:bg-restro-button-hover rounded-lg transition active:scale-95"
              >
                ⌫
              </button>
              <button
                onClick={() => handleVirtualKeyboardInput("enter")}
                className="flex-1 px-4 py-3 text-lg font-medium bg-restro-green text-white hover:bg-restro-green-button-hover rounded-lg transition active:scale-95"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      </dialog>
      {/* dialog: virtual keyboard for orders */}
    </Page>
  );
}
