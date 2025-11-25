/** @format */

import React, { useContext, useEffect, useRef, useState } from "react";
import Page from "../components/Page";
import {
  cancelKitchenOrder,
  completeKitchenOrder,
  getOrdersInit,
  updateKitchenOrderItemStatus,
} from "../controllers/orders.controller";
import {
  useIncompleteDayOutReservations,
  useDayOutPackageById,
  useDayOutReservationsInit,
  getIncompleteDayOutReservations,
  getCompleteDayOutOrderPaymentSummary,
  payAndCompleteDayOutReservation,
} from "../controllers/dayOutReservation.controller";
import { validatePromoCode } from "../controllers/pos.controller";
import { useServiceCharge } from "../controllers/settings.controller";
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
  IconBuilding,
} from "@tabler/icons-react";
import { VITE_BACKEND_SOCKET_IO, iconStroke } from "../config/config";
import { CURRENCIES } from "../config/currencies.config";
import { PAYMENT_ICONS } from "../config/payment_icons";
import { setDetailsForDayOutReceiptPrint } from "../helpers/ReceiptHelper";

import { SocketContext } from "../contexts/SocketContext";
import { initSocket } from "../utils/socket";
import { textToSpeech } from "../utils/textToSpeech";
import { getUserDetailsInLocalStorage } from "../helpers/UserDetails";

export default function DayOutOrdersPage() {
  const printReceiptRef = useRef();
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);

  const [state, setState] = useState({
    dayOutOrders: [], // Stores the ongoing day-out reservations
    printSettings: null,
    storeSettings: null,
    paymentTypes: [],
    isLoading: true,

    cancelOrderIds: [],
    completeOrderIds: [],
    additionalServiceIds: [],
    completeTokenIds: "",

    currency: null,

    summaryNetTotal: 0,
    summaryTaxTotal: 0,
    summaryTotal: 0,
    summaryDiscount: 0,
    summaryOrders: [],
    summaryadditionalServices: [],
    totalServiceCharge: 0,
    roomNo: "",
    order: null,
    type: "",
    message: "",

    reservationId: 0,
    promocodeType: "",
    promocode: "", // Promo code applied
    success: false, // Flag for success message display

    package_id: "", // Package ID of the ongoing reservation
    id: "", // Reservation ID
    package_status: "", // Status of the reservation ("check-in")
  });

  const [showCreditCardPopup, setShowCreditCardPopup] = useState(false); // State for credit card popup
  const [creditCardDigits, setCreditCardDigits] = useState(""); // State for credit card digits

  useEffect(() => {
    _init();
    _initSocket();
  }, []);

  const {
    dayOutOrders,
    printSettings,
    storeSettings,
    paymentTypes,
    isLoading,
    currency,
  } = state;

  const _init = async () => {
    try {
      const [ordersResponse, ordersInitResponse] = await Promise.all([
        getIncompleteDayOutReservations(),
        getOrdersInit(),
      ]);

      if (ordersResponse.status == 200 && ordersInitResponse.status == 200) {
        const orders = ordersResponse?.data.data || [];
        const ordersInit = ordersInitResponse.data;
        console.log("ordersInit", ordersInit);
        console.log("orders", orders);

        const currency = CURRENCIES.find(
          (c) => c.cc === ordersInitResponse?.storeSettings?.currency
        );

        setState({
          ...state,
          dayOutOrders: orders, // Save normalized orders
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
      const res = await getIncompleteDayOutReservations();
      toast.dismiss();
      // Extract orders correctly
      const refreshedOrders = res?.data?.data || [];

      const updatedOrders = refreshedOrders?.map((order) => ({
        id: order.id,
        package_id: order.package_id,
        package_name: order.package_name,
        package_status: order.package_status,
        final_price: order.final_price,
        advanced_amount: order.advanced_amount,
        note: order.note,
        check_in_time: order.check_in_time,
        check_out_time: order.check_out_time,
        orders: order.orders || [],
        additional_services: order.additional_services,
        order_ids: order.order_ids || [],
        type: "day-out",
      }));

      setState((prevState) => ({
        ...prevState,
        dayOutOrders: updatedOrders,
        isLoading: false,
      }));

      toast.success("Orders Refreshed!");
    } catch (error) {
      console.error("Error refreshing orders:", error);
      toast.dismiss();
      toast.error("Error refreshing orders! Please try later!");

      setState((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
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

  const btnShowPayAndComplete = async (
    orderIdsArr,
    tokens,
    reservation_id,
    services_ids
  ) => {
    console.log("orderIdsArr", orderIdsArr);
    console.log("reservation_id", reservation_id);
    console.log("services_ids", services_ids);
    const orderIds = orderIdsArr.map((id) => String(id));
    const servicesIds = services_ids.map((id) => String(id));

    try {
      toast.loading("Please wait...");

      const res = await getCompleteDayOutOrderPaymentSummary(
        reservation_id,
        orderIds,
        servicesIds
      );

      toast.dismiss();
      if (res.status === 200) {
        const {
          packagePrice,
          packageTaxAmount,
          totalServiceCharge,
          price_per_person,
          advanceAmount,
          check_in_time,
          check_out_time,
          customer_name,
          guest_count,
          note,
          package_name,
          subtotal,
          taxTotal,
          total,
          orders = [],
          additional_services = [],
          discount = 0,
          promocodeType = "",
          promocode = "",
          type = "online",
        } = res.data;

        console.log("orders last ", res);
        console.log("reservation id ", reservation_id);

        let tokens = "";
        let completeOrderIds = "";
        let additionalServiceIds = "";

        if (Array.isArray(orders) && orders?.length > 0) {
          const tokenNoArray = orders.map((o) => o.token_no);
          tokens = tokenNoArray.join(",");

          // Extracting order IDs
          const orderIdsArray = orders.map((o) => o.id);
          completeOrderIds = orderIdsArray.join(",");
        }

        // Extract additional service IDs
        if (
          Array.isArray(additional_services) &&
          additional_services?.length > 0
        ) {
          const serviceIdsArray = additional_services.flatMap((service) =>
            service.items.map((item) => item.id)
          );
          additionalServiceIds = serviceIdsArray.join(",");
        }

        // Extract discount and promocode details from the first order if available
        let orderDiscount = discount;
        let promocodeType1 = promocodeType;
        let promocode1 = promocode;

        if (orders.length > 0) {
          orderDiscount = orders[0]?.discount ?? 0;
          promocodeType1 = orders[0]?.promocodeType || "";
          promocode1 = orders[0]?.promocode || "";
        }

        setState({
          ...state,
          summaryNetTotal: subtotal,
          summaryTaxTotal: taxTotal,
          summaryTotal:
            total - orderDiscount + (state.miscellaneousCharges || 0),
          summaryDiscount: orderDiscount,
          summaryOrders: orders,
          summaryadditionalServices: additional_services,
          reservationId: reservation_id,
          totalServiceCharge: totalServiceCharge,
          promocodeType: promocodeType1,
          promocode: promocode1,
          completeOrderIds: completeOrderIds,
          completeTokenIds: tokens,
          additionalServiceIds: additionalServiceIds,
          miscellaneousCharges: state.miscellaneousCharges || 0,
          note: state.note || "",
          type: state.type || "",
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

  //  Function to handle Miscellaneous Charges input changes
  const handleMiscellaneousChargesChange = (e) => {
    const chargeAmount = parseFloat(e.target.value) || 0;
    setState((prevState) => ({
      ...prevState,
      miscellaneousCharges: chargeAmount,
      summaryTotal:
        prevState.summaryNetTotal +
        prevState.summaryTaxTotal -
        prevState.summaryDiscount +
        chargeAmount,
    }));
  };

  // Function to handle Notes input changes
  const handleNotesChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      note: e.target.value,
    }));
  };

  const btnPayAndComplete = async () => {
    const isPrintReceipt = printReceiptRef.current.checked || false;

    console.log("reservation Id 2", state.reservationId);

    try {
      toast.loading("Please wait...");

      // Extract additional service IDs
      const services =
        state.summaryadditionalServices?.flatMap(
          (service) => service.items?.map((item) => String(item.id)) || []
        ) || [];

      const res = await payAndCompleteDayOutReservation(
        creditCardDigits,
        state.summaryDiscount,
        Number(state.reservationId),
        state.completeOrderIds ? state.completeOrderIds.split(",") : [],
        services,
        state.promocode || null,
        state.promocodeType || null,
        state.selectedPaymentType,
        state.summaryNetTotal,
        state.summaryTaxTotal,
        state.summaryTotal,
        state.miscellaneousCharges,
        state.note,
        state.totalServiceCharge
      );

      toast.dismiss();
      if (res.status == 200) {
        sendOrderUpdateEvent();
        await refreshOrders();
        toast.success(res.data.message);
        document.getElementById("modal-order-summary-complete").close();
        setCreditCardDigits("");

        if (isPrintReceipt) {
          const orders = [];
          console.log("state.completeOrderIds", state.completeOrderIds);
          // const orderIds = state.completeOrderIds.join(", ");

          for (const o of state.summaryOrders) {
            const items = o.items;
            items.forEach((i) => {
              const variant = i.variant_id
                ? {
                    id: i.variant_id,
                    title: i.variant_title,
                    price: i.variant_price,
                  }
                : null;
              orders.push({
                ...i,
                title: i.item_title,
                addons_ids:
                  i?.addons?.length > 0 ? i?.addons?.map((a) => a.id) : [],
                variant: variant,
              });
            });
          }

          // Transforming data to match the structure in the function
          const addServiceByDayout = state.summaryadditionalServices.reduce(
            (acc, service) => {
              const reservation_id = service.day_out_reservation_id; // Using day_out_reservation_id instead of room_no

              if (!acc[reservation_id]) {
                acc[reservation_id] = {
                  day_out_reservation_id: reservation_id, // Assigning day_out_reservation_id
                  token_no: service.token_no || null,
                  advanced_amount: service.advanced_amount || null,
                  note: service.note || "",
                  discount: service.discount || null,
                  items: [],
                };
              }

              // Merge items into the existing day_out_reservation_id entry
              acc[reservation_id].items.push(
                ...service.items.map((i) => ({
                  id: i.id,
                  services: i.services,
                  sub_services: i.sub_services,
                  count: i.count,
                  final_price: i.final_price,
                  price: i.price,
                  tax_value: i.tax_value,
                }))
              );

              return acc;
            },
            {}
          );

          const {
            customer_id,
            customer_type,
            customer_name,
            date,
            delivery_type,
          } = state.summaryOrders[0] || [];

          const paymentType = paymentTypes.find(
            (v) => v.id == state.selectedPaymentType
          );
          let paymentMethodText;
          if (paymentType) {
            paymentMethodText = paymentType.title;
          }

          setDetailsForDayOutReceiptPrint({
            cartItems: orders,
            serviceItems: addServiceByDayout,
            deliveryType: delivery_type,
            customerType: customer_type,
            customer: { id: customer_id, name: customer_name },
            // tableId: table_id,
            currency,
            storeSettings,
            printSettings,
            dayOutDetails: state.summaryadditionalServices?.map((dayout) => ({
              reservationId: dayout.reservation_id,
              status: dayout.room_status,
              checkIn: dayout.check_in_date,
              checkOut: dayout.check_out_date,
              note: dayout.note,
              advancedAmount: dayout.advanced_amount,
              price_per_person: dayout.price_per_person,
              guest_count: guest_count,
              finalPrice: final_price,
              packageName: package_name,
            })),
            promocodeType: state.promocodeType,
            promocode: state.promocode,
            discount: state.summaryDiscount,
            itemsTotal: state.summaryNetTotal,
            taxTotal: state.summaryTaxTotal,
            payableTotal: state.summaryTotal,
            tokenNo: state.completeTokenIds,
            // orderId: orderIds,
            paymentMethod: paymentMethodText,
          });

          setState((prev) => ({ ...prev, selectedPaymentType: null }));

          const receiptWindow = window.open(
            "/print-day-out-receipt",
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

  const btnPrintReceipt = async (
    orderIdsArr,
    tokens,
    reservation_id,
    services_ids
  ) => {
    console.log("orderIdsArr", orderIdsArr);
    console.log("reservation_id", reservation_id);
    console.log("services_ids", services_ids);
    const orderIds = orderIdsArr.map((id) => String(id));
    const servicesIds = services_ids.map((id) => String(id));

    try {
      toast.loading("Please wait...");
      const res = await getCompleteDayOutOrderPaymentSummary(
        reservation_id,
        orderIds,
        servicesIds
      );
      toast.dismiss();

      if (res.status === 200) {
        const {
          packagePrice,
          packageTaxAmount,
          totalServiceCharge,
          price_per_person,
          advanceAmount,
          subtotal,
          taxTotal,
          total,
          additional_services,
          check_in_time,
          check_out_time,
          customer_name,
          guest_count,
          note,
          package_name,
          orders: ordersArr,
        } = res.data;
        console.log("orderarr:", ordersArr);
        console.log("additional_services", additional_services);

        const orders = [];
        if (ordersArr.length > 0) {
          for (const o of ordersArr) {
            const items = o.items;
            items.forEach((i) => {
              const variant = i.variant_id
                ? {
                    id: i.variant_id,
                    title: i.variant_title,
                    price: i.variant_price,
                  }
                : null;
              orders.push({
                ...i,
                title: i.item_title,
                addons_ids:
                  i?.addons?.length > 0 ? i?.addons?.map((a) => a.id) : [],
                variant: variant,
              });
            });
          }
        }

        // Transforming data to match the structure in the function
        const addServiceByDayout = additional_services.reduce(
          (acc, service) => {
            const reservation_id = service.day_out_reservation_id; // Using day_out_reservation_id instead of room_no

            if (!acc[reservation_id]) {
              acc[reservation_id] = {
                day_out_reservation_id: reservation_id, // Assigning day_out_reservation_id
                token_no: service.token_no || null,
                advanced_amount: service.advanced_amount || null,
                note: service.note || "",
                discount: service.discount || null,
                items: [],
              };
            }

            // Merge items into the existing day_out_reservation_id entry
            acc[reservation_id].items.push(
              ...service.items.map((i) => ({
                id: i.id,
                services: i.services,
                sub_services: i.sub_services,
                count: i.count,
                final_price: i.final_price,
                price: i.price,
                tax_value: i.tax_value,
              }))
            );

            return acc;
          },
          {}
        );

        console.log("services grouped by room:", addServiceByDayout);

        const detailsForReceipt = {
          cartItems: orders,
          serviceItems: addServiceByDayout,
          currency,
          storeSettings,
          printSettings,
          price_per_person: price_per_person,
          check_in_time: check_in_time,
          check_out_time: check_out_time,
          customer_name: customer_name,
          guest_count: guest_count,
          note: note,
          reservation_id: reservation_id,
          packageName: package_name,
          itemsTotal: subtotal,
          taxTotal: taxTotal,
          payableTotal: total,
          packagePrice: packagePrice,
          packageTaxAmount: packageTaxAmount,
          totalServiceCharge: totalServiceCharge,
          advanceAmount: advanceAmount,
        };
        console.log("detailsForReceipt", detailsForReceipt);
        setDetailsForDayOutReceiptPrint(detailsForReceipt);

        const receiptWindow = window.open(
          "/print-day-out-receipt",
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
        <h3 className="text-3xl font-light">Day Out Orders</h3>
        <button
          onClick={refreshOrders}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconRefresh size={22} stroke={iconStroke} /> Refresh
        </button>
      </div>

      {dayOutOrders?.length == 0 && (
        <div className="w-full h-[calc(100vh-15vh)] flex gap-4 flex-col items-center justify-center">
          <img
            src="/assets/illustrations/kitchen.svg"
            alt="no orders"
            className="w-full md:w-60"
          />
          <p className="text-gray-400">No Orders Pending!</p>
        </div>
      )}

      {dayOutOrders?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {dayOutOrders.map((order, index) => {
            console.log(
              "Orders received dayOutOrders dayOutOrders:",
              dayOutOrders
            );

            const {
              package_id,
              reservation_id,
              check_in_time,
              check_out_time,
              package_status,
              advanced_amount,
              package_name,
              additional_services,
              orders,
              order_ids,
              services_ids,
              final_price,
            } = order;

            // Extract token_no from orders and additional_services
            const tokenNoArray = [
              ...(orders?.map((o) => o.token_no) || []),
              ...(additional_services?.map((s) => s.token_no) || []),
            ];

            // Join token numbers into a comma-separated string
            const tokens = tokenNoArray.join(",");

            return (
              <div
                key={index}
                className="flex flex-col px-4 py-5 border divide-y border-restro-border-green-light rounded-2xl divide-dashed"
              >
                <div className="flex flex-col items-center gap-2 pb-2 text-center md:flex-row md:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                      <IconBuilding size={24} stroke={iconStroke} />
                    </div>
                    <div>
                      {reservation_id && (
                        <p className="text-sm text-left">
                          Reservation ID : {reservation_id}
                        </p>
                      )}
                      {package_name && (
                        <p className="text-sm text-left">
                          Package Name : {package_name}
                        </p>
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
                          className="flex items-center gap-2 bg-transparent border-none shadow-none "
                          onClick={() => {
                            btnPrintReceipt(
                              order_ids,
                              tokens,
                              reservation_id,
                              services_ids
                            );
                          }}
                        >
                          <IconReceipt size={18} stroke={iconStroke} /> Print
                          Receipt
                        </button>
                      </li>

                      <li>
                        <button
                          className="flex items-center gap-2 text-green-500 bg-transparent border-none shadow-none "
                          onClick={() => {
                            btnShowPayAndComplete(
                              order_ids,
                              tokens,
                              reservation_id,
                              services_ids
                            );
                          }}
                        >
                          <IconCash size={18} stroke={iconStroke} /> Pay &
                          Complete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="px-2 py-2 mt-2 mb-2 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <p>Check In Time : {check_in_time}</p>
                      <p>Check Out Time : {check_out_time}</p>
                      <p>Status : {package_status}</p>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <IconCash stroke={iconStroke} size={18} />
                    {advanced_amount && (
                      <p className="text-sm"> Paid Advance</p>
                    )}
                  </p>

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
                              {/* status*/}
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
                              {/* action*/}
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
            <h3 className="text-lg font-bold">Pay & Complete Dayout Order!</h3>
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

                {state.totalServiceCharge && (
                  <div className="flex-1 text-center">
                    <p>Service Charge</p>
                    <p className="text-l">
                      +{currency}
                      {Number(state.totalServiceCharge).toFixed(2)}
                    </p>
                  </div>
                )}
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

                {state.totalServiceCharge && (
                  <div className="flex-1 text-center">
                    <p>Service Charge</p>
                    <p className="text-l">
                      +{currency}
                      {Number(state.totalServiceCharge).toFixed(2)}
                    </p>
                  </div>
                )}

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
          {paymentTypes && paymentTypes?.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {paymentTypes.map((paymentType, i) => (
                <label key={i}>
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
                    ) : null}
                    <p className="text-xs">{paymentType.title}</p>
                  </label>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No Payment Types Available</p>
          )}

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
                className="w-full text-white btn hover:bg-restro-green-dark bg-restro-green"
              >
                Pay & Complete Dayout Order
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: complete order & payment summary */}
    </Page>
  );
}
