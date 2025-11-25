/** @format */

import React, { useContext, useEffect, useRef, useState } from "react";

import Page from "../../components/Page";
import {
  IconPlus,
  IconNotes,
  IconArmchair,
  IconScreenShare,
  IconSearch,
  IconDeviceFloppy,
  IconChefHat,
  IconCash,
  IconMinus,
  IconNote,
  IconTrash,
  IconFilter,
  IconPhoto,
  IconFilterFilled,
  IconClipboardList,
  IconX,
  IconClearAll,
  IconPencil,
  IconCheck,
  IconCarrot,
  IconRotate,
  IconQrcode,
  IconArmchair2,
  IconUser,
} from "@tabler/icons-react";
import { VITE_BACKEND_SOCKET_IO, iconStroke } from "../../config/config";
import {
  cancelAllQROrders,
  cancelQROrder,
  createOrder,
  createOrderAndInvoice,
  getDrafts,
  getQROrders,
  getQROrdersCount,
  initPOS,
  setDrafts,
} from "../../controllers/menuItems.controller";
import { CURRENCIES } from "../../config/currencies.config";
import { PAYMENT_ICONS } from "../../config/payment_icons";
import { toast } from "react-hot-toast";
import { searchCustomer } from "../../controllers/customers.controller";
import { Link, useNavigate } from "react-router-dom";
import { setDetailsForReceiptPrint } from "../../helpers/ReceiptHelper";
import { SocketContext } from "../../contexts/SocketContext";
import { initSocket } from "../../utils/socket";
import { getImageURL } from "../../helpers/ImageHelper";
import { getUserDetailsInLocalStorage } from "../../helpers/UserDetails";
import AsyncCreatableSelect from "react-select/async-creatable";
import DialogAddCustomer from "../../components/DialogAddCustomer";

export default function MenuItems() {
  const user = getUserDetailsInLocalStorage();
  const { socket, isSocketConnected } = useContext(SocketContext);
  const navigate = useNavigate();

  const diningOptionRef = useRef();
  const tableRef = useRef();

  // dialog: notes ref
  const dialogNotesIndexRef = useRef();
  const dialogNotesTextRef = useRef();
  // dialog: notes ref

  // dialog: category filter
  const categoryFilterDropdownRef = useRef(null);
  // dialog: category filter

  // dialog: category filter
  const draftTitleRef = useRef(null);
  // dialog: category filter

  // dialog: search customer
  const searchCustomerRef = useRef(null);
  // dialog: search customer

  const [state, setState] = useState({
    categories: [],
    menuItems: [],
    paymentTypes: [],
    printSettings: null,
    storeSettings: null,
    storeTables: [],
    currency: "",
    isLoading: true,

    cartItems: [],
    customerType: "WALKIN",
    customer: null,
    addCustomerDefaultValue: null,

    searchQuery: "",
    selectedCategory: "all",

    selectedItemId: null,

    drafts: [],

    itemsTotal: 0,
    taxTotal: 0,
    payableTotal: 0,

    orderId: null,
    tokenNo: null,

    qrOrdersCount: 0,
    qrOrders: [],
    selectedQrOrderItem: null,

    selectedPaymentType: null,
  });

  useEffect(() => {
    _initPOS();
    _initSocket();
  }, []);

  const {
    categories,
    menuItems,
    paymentTypes,
    printSettings,
    storeSettings,
    storeTables,
    currency,
    cartItems,
    searchQuery,
    selectedCategory,
    selectedItemId,
    drafts,
    customer,
    customerType,
    isLoading,
  } = state;

  const sendNewOrderEvent = (tokenNo, orderId) => {
    if (isSocketConnected) {
      socket.emit("new_order_backend", { tokenNo, orderId }, user.tenant_id);
    } else {
      // Handle disconnected state (optional)
      initSocket();
      socket.emit("new_order_backend", { tokenNo, orderId }, user.tenant_id);
    }
  };

  async function _initPOS() {
    try {
      const res = await initPOS();
      let totalQROrders = 0;

      if (res.status == 200) {
        const data = res.data;

        const currency = CURRENCIES.find(
          (c) => c.cc == data?.storeSettings?.currency
        );

        try {
          totalQROrders = await _getQROrdersCount();
        } catch (error) {
          console.log(error);
        }

        setState({
          ...state,
          categories: data.categories,
          menuItems: data.menuItems,
          paymentTypes: data.paymentTypes,
          printSettings: data.printSettings,
          storeSettings: data.storeSettings,
          storeTables: data.storeTables,
          currency: currency?.symbol || "",
          qrOrdersCount: totalQROrders || 0,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  const _getQROrdersCount = async () => {
    try {
      const res = await getQROrdersCount();
      if (res.status == 200) {
        const data = res.data;

        return data?.totalQROrders || 0;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  const _initSocket = () => {
    if (isSocketConnected) {
      socket.emit("authenticate", user.tenant_id);
      socket.on("new_qrorder", async (payload) => {
        try {
          const totalQROrders = await _getQROrdersCount();

          setState((prevState) => ({
            ...prevState,
            qrOrdersCount: totalQROrders || 0,
          }));
        } catch (error) {
          console.log(error);
        }
      });
    } else {
      initSocket();
      socket.emit("authenticate", user.tenant_id);
      socket.on("new_qrorder", async (payload) => {
        try {
          const totalQROrders = await _getQROrdersCount();

          setState((prevState) => ({
            ...prevState,
            qrOrdersCount: totalQROrders || 0,
          }));
        } catch (error) {
          console.log(error);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <Page className="px-4 py-3 flex flex-col min-h-0">
        <div className="mt-4 h-[calc(100vh-136px)] flex gap-4 skeleton">
          <div className="border border-restro-border-green-light rounded-2xl h-full w-[70%] overflow-y-auto"></div>
          <div className="border border-restro-border-green-light rounded-2xl h-full w-[30%] relative flex flex-col"></div>
        </div>
      </Page>
    );
  }

  // cart
  function addItemToCart(item) {
    const modifiedItem = {
      ...item,
      quantity: 1,
      notes: null,
    };
    if (!cartItems) {
      setState({
        ...state,
        cartItems: [modifiedItem],
      });
      return;
    }
    setState({
      ...state,
      cartItems: [...cartItems, modifiedItem],
    });
  }

  function removeItemFromCart(index) {
    setState({
      ...state,
      cartItems: cartItems.filter((c, i) => i !== index),
    });
  }

  function addCartItemQuantity(index, currentQuantity) {
    const newQuantity = currentQuantity + 1;
    const newCartItems = cartItems;

    newCartItems[index].quantity = newQuantity;

    setState({
      ...state,
      cartItems: [...newCartItems],
    });
  }
  function minusCartItemQuantity(index, currentQuantity) {
    const newQuantity = currentQuantity - 1;
    let newCartItems = cartItems;

    newCartItems[index].quantity = newQuantity;

    if (newQuantity == 0) {
      newCartItems = cartItems.filter((v, i) => i != index);
    }

    setState({
      ...state,
      cartItems: [...newCartItems],
    });
  }
  // cart

  // order notes
  const btnOpenNotesModal = (index, notes) => {
    dialogNotesIndexRef.current.value = index;
    dialogNotesTextRef.current.value = notes;
    document.getElementById("modal-notes").showModal();
  };
  const btnAddNotes = () => {
    const index = dialogNotesIndexRef.current.value;
    const notes = dialogNotesTextRef.current.value || null;

    const newCartItems = cartItems;
    newCartItems[index].notes = notes;

    setState({
      ...state,
      cartItems: newCartItems,
    });
  };
  // order notes

  // category filter modal
  const btnOpenCategoryFilterModal = () => {
    categoryFilterDropdownRef.current.value = selectedCategory;
    document.getElementById("modal-categories").showModal();
  };
  const btnApplyCategoryFilter = () => {
    const selectedCategoryFromDropdown =
      categoryFilterDropdownRef.current.value || "";
    setState({
      ...state,
      selectedCategory: selectedCategoryFromDropdown,
    });
  };
  const btnClearSelectedCategory = () => {
    setState({
      ...state,
      selectedCategory: "all",
    });
  };
  // category filter modal

  // variant, addon modal
  const btnOpenVariantAndAddonModal = (menuItemId) => {
    setState({
      ...state,
      selectedItemId: menuItemId,
    });
    document.getElementById("modal-variants-addons").showModal();
  };
  const btnAddMenuItemToCartWithVariantsAndAddon = () => {
    let price = 0;
    let selectedVariantId = null;
    const selectedAddonsId = [];

    const itemVariants = document.getElementsByName("variants");
    itemVariants.forEach((item) => {
      if (item.checked) {
        selectedVariantId = item.value;
        return;
      }
    });

    const itemAddons = document.getElementsByName("addons");
    itemAddons.forEach((item) => {
      if (item.checked) {
        selectedAddonsId.push(item.value);
      }
    });

    // get selected menu item
    const selectedItem = menuItems.find((item) => item.id == selectedItemId);

    const addons = selectedItem?.addons || [];
    const variants = selectedItem?.variants || [];

    let selectedVariant = null;
    if (selectedVariantId) {
      selectedVariant = variants.find((v) => v.id == selectedVariantId);
      price = parseFloat(selectedVariant.price);
    } else {
      price = parseFloat(selectedVariant?.price ?? selectedItem.price);
    }

    let selectedAddons = [];
    if (selectedAddonsId?.length > 0) {
      selectedAddons = selectedAddonsId.map((addonId) =>
        addons.find((addon) => addon.id == addonId)
      );
      selectedAddons.forEach((addon) => {
        const addonPrice = parseFloat(addon.price);
        price = price + addonPrice;
      });
    }

    const itemCart = {
      ...selectedItem,
      price: price,
      variant_id: selectedVariantId,
      variant: selectedVariant,
      addons_ids: selectedAddonsId,
      addons: selectedAddons,
    };
    addItemToCart(itemCart);
  };
  // variant, addon modal

  // drafts
  const btnOpenSaveDraftModal = () => {
    if (cartItems.length == 0) {
      toast.error("Cart is empty!");
      return;
    }
    document.getElementById("modal-save-draft").showModal();
  };
  const btnAddtoDrafts = () => {
    const drafts = getDrafts();

    const nameRef = draftTitleRef.current.value || "";
    const date = new Date().toLocaleString();

    const draftItem = {
      nameRef: nameRef,
      date,
      cart: cartItems,
    };

    drafts.push(draftItem);

    setDrafts(drafts);
    setState({
      ...state,
      cartItems: [],
    });
  };

  const btnInitNewOrder = () => {
    setState({
      ...state,
      cartItems: [],
      customer: null,
      customerType: "WALKIN",
      selectedQrOrderItem: null,
    });
  };

  const btnOpenDraftsModal = () => {
    const drafts = getDrafts();
    setState({
      ...state,
      drafts: [...drafts],
    });
    document.getElementById("modal-drafts").showModal();
  };

  const btnDeleteDraftItem = (index) => {
    const drafts = getDrafts();
    const newDrafts = drafts.filter((v, i) => i != index);

    setDrafts(newDrafts);

    setState({
      ...state,
      drafts: [...newDrafts],
    });
  };

  const btnClearDrafts = () => {
    setDrafts([]);
    setState({
      ...state,
      drafts: [],
    });
  };
  const btnSelectDraftItemToCart = (draftItem) => {
    const { nameRef, date, cart } = draftItem;

    setState({
      ...state,
      cartItems: [...cart],
    });

    document.getElementById("modal-drafts").close();
  };
  // drafts

  // QR Menu Orders
  const btnShowQROrdersModal = async () => {
    try {
      const res = await getQROrders();
      if (res.status == 200) {
        const data = res.data;
        setState({
          ...state,
          qrOrders: [...data],
        });
        document.getElementById("modal-qrorders").showModal();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const btnClearQROrders = async () => {
    const isConfirm = window.confirm(
      "Are you sure? This process is irreversible!"
    );
    if (!isConfirm) {
      return;
    }
    try {
      toast.loading("Please wait...");
      const res = await cancelAllQROrders();
      if (res.status == 200) {
        toast.dismiss();
        toast.success(res.data.message);
        setState((prevState) => ({
          ...prevState,
          qrOrders: [],
          qrOrdersCount: 0,
        }));
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "We're getting issue while clearing orders! Please try later!";
      console.log(error);
      toast.dismiss();
      toast.error(message);
    }
  };
  const btnCancelQROrder = async (orderId) => {
    const isConfirm = window.confirm(
      "Are you sure? This process is irreversible!"
    );
    if (!isConfirm) {
      return;
    }
    try {
      toast.loading("Please wait...");
      const res = await cancelQROrder(orderId);
      if (res.status == 200) {
        toast.dismiss();
        toast.success(res.data.message);

        const newQROrders = state.qrOrders.filter((item) => item.id != orderId);
        const newQROrderItem = state.qrOrdersCount - 1;

        setState((prevState) => ({
          ...prevState,
          qrOrders: [...newQROrders],
          qrOrdersCount: newQROrderItem,
        }));
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "We're getting issue while clearing orders! Please try later!";
      console.log(error);
      toast.dismiss();
      toast.error(message);
    }
  };
  const btnSelectQROrder = (qrOrder) => {
    console.log(qrOrder);

    if (qrOrder.table_id) {
      tableRef.current.value = qrOrder.table_id;
    }

    // const itemCart = {...selectedItem, price: price, variant_id: selectedVariantId, variant: selectedVariant, addons_ids: selectedAddonsId, addons: selectedAddons}

    const modifiedCart = qrOrder?.items?.map((item) => {
      const id = item.item_id;
      return {
        ...item,
        id: id,
        title: item.item_title,
        addons_ids: item?.addons?.map((i) => i.id),
      };
    });

    setState({
      ...state,
      cartItems: modifiedCart,
      selectedQrOrderItem: qrOrder.id,
      customerType: qrOrder.customer_type,
      customer: { phone: qrOrder.customer_id, name: qrOrder.customer_name },
    });

    document.getElementById("modal-qrorders").close();
  };
  // QR MEnu Orders

  // search customer modal
  const btnOpenSearchCustomerModal = () => {
    document.getElementById("modal-search-customer").showModal();
  };
  const btnClearSearchCustomer = () => {
    setState({
      ...state,
      customerType: "WALKIN",
      customer: null,
    });
  };
  const btnSearchCustomer = async () => {
    const phone = searchCustomerRef.current.value;

    if (!phone) {
      toast.error("Please provide phone number to search!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const resp = await searchCustomer(phone);
      toast.dismiss();
      if (resp.status == 200) {
        setState({
          ...state,
          customer: resp.data,
          customerType: "CUSTOMER",
        });
        document.getElementById("modal-search-customer").close();
      }
    } catch (error) {
      console.log(error);
      const message =
        error.response.data.message ||
        "Error getting details! please try later!";
      toast.dismiss();
      toast.error(message);
    }
  };
  // search customer modal

  // send to kitchen modal
  const calculateOrderSummary = () => {
    let itemsTotal = 0; // without tax - net amount
    let taxTotal = 0;
    let payableTotal = 0;

    cartItems.forEach((item) => {
      const taxId = item.tax_id;
      const taxTitle = item.tax_title;
      const taxRate = Number(item.tax_rate);
      const taxType = item.tax_type; // inclusive or exclusive or NULL

      const itemPrice = Number(item.price) * Number(item.quantity);

      if (taxType == "exclusive") {
        const tax = (itemPrice * taxRate) / 100;
        const priceWithTax = itemPrice + tax;

        taxTotal += tax;
        itemsTotal += itemPrice;
        payableTotal += priceWithTax;
      } else if (taxType == "inclusive") {
        const tax = itemPrice - itemPrice * (100 / (100 + taxRate));
        const priceWithoutTax = itemPrice - tax;

        taxTotal += tax;
        itemsTotal += priceWithoutTax;
        payableTotal += itemPrice;
      } else {
        itemsTotal += itemPrice;
        payableTotal += itemPrice;
      }
    });
    return {
      itemsTotal,
      taxTotal,
      payableTotal,
    };
  };
  const btnShowPayAndSendToKitchenModal = () => {
    // calculate the item - total, tax, incl. tax, excl. tax, tax total, payable total

    if (cartItems?.length == 0) {
      toast.error("Cart is Empty!");
      return;
    }

    const { itemsTotal, taxTotal, payableTotal } = calculateOrderSummary();

    setState({
      ...state,
      itemsTotal,
      taxTotal,
      payableTotal,
    });
    document.getElementById("modal-pay-and-send-kitchen-summary").showModal();
  };
  const btnPayAndSendToKitchen = async () => {
    try {
      const deliveryType = diningOptionRef.current.value;
      const tableId = tableRef.current.value;
      const customerType = state.customerType;
      const customer = state.customer;

      toast.loading("Please wait...");
      const res = await createOrderAndInvoice(
        cartItems,
        deliveryType,
        customerType,
        customer,
        tableId,
        state.itemsTotal,
        state.taxTotal,
        state.payableTotal,
        state.selectedQrOrderItem,
        state.selectedPaymentType
      );
      toast.dismiss();
      if (res.status == 200) {
        const data = res.data;
        toast.success(res.data.message);
        document.getElementById("modal-pay-and-send-kitchen-summary").close();

        const page_format = printSettings?.page_format || null;
        const is_enable_print = printSettings?.is_enable_print || 0;

        const paymentType = paymentTypes.find(
          (v) => v.id == state.selectedPaymentType
        );
        let paymentMethodText;
        if (paymentType) {
          paymentMethodText = paymentType.title;
        }

        setDetailsForReceiptPrint({
          cartItems,
          deliveryType,
          customerType,
          customer,
          tableId,
          currency,
          storeSettings,
          printSettings,
          itemsTotal: state.itemsTotal,
          taxTotal: state.taxTotal,
          payableTotal: state.payableTotal,
          tokenNo: data.tokenNo,
          orderId: data.orderId,
          paymentMethod: paymentMethodText,
        });

        sendNewOrderEvent(data.tokenNo, data.orderId);

        let newQROrderItemCount = state.qrOrdersCount;
        let newQROrders = [];
        if (state.selectedQrOrderItem) {
          newQROrderItemCount -= 1;
          newQROrders = state?.qrOrders?.filter(
            (item) => item.id != state.selectedQrOrderItem
          );
        }

        setState({
          ...state,
          cartItems: [],
          tokenNo: data.tokenNo,
          orderId: data.orderId,
          selectedQrOrderItem: null,
          qrOrders: newQROrders,
          qrOrdersCount: newQROrderItemCount,
          selectedPaymentType: null,
        });

        if (is_enable_print) {
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
          return;
        }

        // show print token dialog
        document.getElementById("modal-print-token").showModal();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };

  const btnShowSendToKitchenModal = () => {
    // calculate the item - total, tax, incl. tax, excl. tax, tax total, payable total

    if (cartItems?.length == 0) {
      toast.error("Cart is Empty!");
      return;
    }

    const { itemsTotal, taxTotal, payableTotal } = calculateOrderSummary();

    setState({
      ...state,
      itemsTotal,
      taxTotal,
      payableTotal,
    });
    document.getElementById("modal-send-kitchen-summary").showModal();
  };

  const btnSendToKitchen = async () => {
    try {
      const deliveryType = diningOptionRef.current.value;
      const tableId = tableRef.current.value;
      const customerType = state.customerType;
      const customer = state.customer;

      toast.loading("Please wait...");
      const res = await createOrder(
        cartItems,
        deliveryType,
        customerType,
        customer,
        tableId,
        state.selectedQrOrderItem
      );
      toast.dismiss();
      if (res.status == 200) {
        const data = res.data;
        toast.success(res.data.message);
        document.getElementById("modal-send-kitchen-summary").close();

        const page_format = printSettings?.page_format || null;
        const is_enable_print = printSettings?.is_enable_print || 0;

        setDetailsForReceiptPrint({
          cartItems,
          deliveryType,
          customerType,
          customer,
          tableId,
          currency,
          storeSettings,
          printSettings,
          itemsTotal: state.itemsTotal,
          taxTotal: state.taxTotal,
          payableTotal: state.payableTotal,
          tokenNo: data.tokenNo,
          orderId: data.orderId,
        });

        sendNewOrderEvent(data.tokenNo, data.orderId);

        let newQROrderItemCount = state.qrOrdersCount;
        let newQROrders = [];
        if (state.selectedQrOrderItem) {
          newQROrderItemCount -= 1;
          newQROrders = state?.qrOrders?.filter(
            (item) => item.id != state.selectedQrOrderItem
          );
        }

        setState({
          ...state,
          cartItems: [],
          tokenNo: data.tokenNo,
          orderId: data.orderId,
          selectedQrOrderItem: null,
          qrOrders: newQROrders,
          qrOrdersCount: newQROrderItemCount,
        });

        if (is_enable_print) {
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
          return;
        }

        // show print token dialog
        document.getElementById("modal-print-token").showModal();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };
  const btnPrintTokenOnly = () => {
    const tokenWindow = window.open(
      "/print-token",
      "_blank",
      "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400"
    );
    tokenWindow.onload = (e) => {
      setTimeout(() => {
        tokenWindow.print();
      }, 400);
    };
    return;
  };
  // send to kitchen modal

  const setCustomer = (customer) => {
    console.log("customer", customer);

    if (customer) {
      setState({
        ...state,
        customer: { phone: customer.value, name: customer.label },
        customerType: "CUSTOMER",
      });
      document.getElementById("modal-search-customer").close();
    } else {
      btnClearSearchCustomer();
    }
  };

  const searchCustomersAsync = async (inputValue) => {
    try {
      if (inputValue) {
        const resp = await searchCustomer(inputValue);
        if (resp.status == 200) {
          return resp?.data?.map((data) => ({
            label: `${data.name} - (${data.phone})`,
            value: data.phone,
          }));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  // search customer modal

  return (
    <Page className="px-4 py-3 flex flex-col min-h-0">
      <div className="flex md:items-center justify-between flex-col md:flex-row gap-2">
        <h3>POS - Point of Sale</h3>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={btnInitNewOrder}
            className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
          >
            <IconPlus size={18} stroke={iconStroke} /> New
          </button>

          {/* QR Menu Orders */}
          <button
            onClick={btnShowQROrdersModal}
            className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1 relative"
          >
            <IconQrcode size={18} stroke={iconStroke} /> QR Menu Orders
            {state.qrOrdersCount > 0 && (
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {state.qrOrdersCount}
              </div>
            )}
          </button>
          {/* QR Menu Orders */}

          <button
            onClick={btnOpenDraftsModal}
            className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
          >
            <IconNotes size={18} stroke={iconStroke} /> Drafts List
          </button>

          <Link
            to="/dashboard/orders"
            className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
          >
            <IconArmchair size={18} stroke={iconStroke} /> Table Orders
          </Link>
        </div>
      </div>

      <div className="mt-4 md:h-[calc(100vh-136px)] flex flex-col-reverse md:flex-row gap-4">
        {/* Menu items */}
        <div className="border border-restro-border-green-light rounded-2xl h-full md:w-[70%] overflow-y-auto">
          {/* categories, search */}
          <div className="flex gap-2 bg-white/40 backdrop-blur sticky top-0 w-full z-10 px-4 py-3 rounded-t-2xl">
            <button
              onClick={btnOpenCategoryFilterModal}
              className="bg-gray-100 hover:bg-gray-200 transition active:scale-95 text-gray-500 rounded-full w-10 h-10 flex items-center justify-center"
            >
              {selectedCategory != "all" ? (
                <IconFilterFilled
                  className="text-restro-green"
                  size={18}
                  stroke={iconStroke}
                />
              ) : (
                <IconFilter size={18} stroke={iconStroke} />
              )}
            </button>
            <label className="w-60 bg-gray-100 rounded-full px-3 py-2 text-gray-500 flex items-center gap-2">
              <IconSearch size={18} stroke={iconStroke} />{" "}
              <input
                value={searchQuery}
                onChange={(e) =>
                  setState({ ...state, searchQuery: e.target.value })
                }
                type="search"
                placeholder="Search Item"
                className="w-full bg-transparent outline-none"
              />
            </label>
          </div>
          {/* categories, search */}

          {/* categories - types */}

          <div className="p-2 w-full md:w-96 overflow-x-auto mx-auto mt-4 flex gap-2">
            <label>
              <input
                onChange={(e) => {
                  setState({
                    ...state,
                    currentCategory: e.target.value,
                  });
                }}
                type="radio"
                name="category"
                id={"all"}
                value={"all"}
                className="peer hidden"
                defaultChecked
              />
              <label
                htmlFor={"all"}
                className="text-xs cursor-pointer rounded-full px-4 py-3 bg-transparent border hover:bg-gray-50 active:scale-95 transition text-gray-500 checked:bg-gray-200 peer-checked:bg-gray-200 flex"
              >
                <p>All</p>
              </label>
            </label>
            {categories?.map((category, index) => {
              const { id, title } = category;
              return (
                <div key={index} className="min-w-fit">
                  <input
                    onChange={(e) => {
                      setState({
                        ...state,
                        currentCategory: e.target.value,
                      });
                    }}
                    type="radio"
                    name="category"
                    id={id}
                    value={id}
                    className="peer hidden"
                  />
                  <label
                    htmlFor={id}
                    className="text-xs min-w-fit flex items-center cursor-pointer rounded-full px-4 py-3 bg-transparent border hover:bg-gray-50 active:scale-95 transition text-gray-500 checked:bg-gray-200 peer-checked:bg-gray-200 "
                  >
                    <p>{title}</p>
                  </label>
                </div>
              );
            })}
          </div>

          {/* categories - types*/}

          {/* list */}
          <div className="grid grid-cols-2 gap-4 w-full z-0 px-4 pb-4 rounded-b-2xl">
            {menuItems
              .filter((menuItem) => {
                if (selectedCategory == "all") {
                  return true;
                }
                return selectedCategory == menuItem.category_id;
              })
              .filter((menuItem) => {
                if (!searchQuery) {
                  return true;
                }
                return new String(menuItem.title)
                  .trim()
                  .toLowerCase()
                  .includes(searchQuery.trim().toLowerCase());
              })
              .map((menuItem, i) => {
                const {
                  title,
                  id,
                  price,
                  image,
                  category_id,
                  category_title,
                  addons,
                  variants,
                } = menuItem;

                const imageURL = image ? getImageURL(image) : null;
                const hasVariantOrAddon =
                  variants?.length > 0 || addons?.length > 0;

                return (
                  <div
                    className="bg-white border border-restro-border-green-light rounded-2xl p-2 flex gap-2"
                    key={i}
                  >
                    <div className="w-28 h-36 bg-gray-100 rounded-lg hidden md:flex items-center justify-center text-gray-300 relative">
                      {image ? (
                        <img
                          src={imageURL}
                          alt={title}
                          className="w-full h-full absolute top-0 left-0 rounded-lg object-cover"
                        />
                      ) : (
                        <IconCarrot />
                      )}
                    </div>
                    <div>
                      <p>{title}</p>
                      <p>
                        {currency}
                        {price}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {category_title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {variants?.length > 0 && (
                          <span>{variants?.length} Variants</span>
                        )}{" "}
                        {addons?.length > 0 && (
                          <span>{addons?.length} Addons</span>
                        )}
                      </p>

                      <div className="mt-2">
                        <button
                          onClick={() => {
                            if (hasVariantOrAddon) {
                              btnOpenVariantAndAddonModal(id);
                            } else {
                              addItemToCart(menuItem);
                            }
                          }}
                          className="rounded-full px-4 py-1 bg-restro-green hover:bg-restro-green-dark transition active:scale-95 text-white flex items-center justify-center"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          {/* list */}
        </div>
        {/* Menu items */}

        {/* cart */}
        <div className="border border-restro-border-green-light rounded-2xl h-full md:w-[30%] relative flex flex-col">
          <div className="sticky w-full px-4 py-4 bg-gradient-to-b from-white to-white/0 border-b rounded-t-2xl">
            {/* search customer */}
            <div
              onClick={btnOpenSearchCustomerModal}
              className="flex items-center gap-2"
            >
              <input
                value={
                  customerType == "WALKIN"
                    ? "WALKIN CUSTOMER"
                    : `${customer.name}`
                }
                type="text"
                placeholder="Search Customer"
                className="cursor-pointer text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              />
              <button
                onClick={btnOpenSearchCustomerModal}
                className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 flex items-center justify-center w-9 h-9"
              >
                <IconSearch size={18} stroke={iconStroke} />
              </button>
            </div>
            {/* search customer */}

            {/* delivery type */}
            <select
              ref={diningOptionRef}
              className="mt-3 text-sm text-gray-500 w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            >
              <option value="">Select Dining Option</option>
              <option value="dinein">Dine-In</option>
              <option value="delivery">Delivery</option>
              <option value="takeaway">Take Away</option>
            </select>
            {/* delivery type */}

            {/* table selection */}
            <select
              ref={tableRef}
              className="mt-3 text-sm text-gray-500 w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            >
              <option value="">Select Table</option>
              {storeTables?.map((table, index) => {
                return (
                  <option value={table.id} key={index}>
                    {table.table_title} ({table.seating_capacity} person) -{" "}
                    {table.floor}
                  </option>
                );
              })}
            </select>
            {/* table selection */}
          </div>

          {/* items */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-4 pb-36">
            <div className="h-4"></div>
            {cartItems?.map((cartItem, i) => {
              const { quantity, notes, title, price, variant, addons } =
                cartItem;
              const itemTotal = price * quantity;
              return (
                <div
                  key={i}
                  className="text-sm border border-restro-border-green-light rounded-lg p-2 relative"
                >
                  <p>
                    #{i + 1} {title} x {quantity}
                  </p>
                  <p className="mt-1">
                    {currency}
                    {Number(price).toFixed(2)}{" "}
                    <span className="text-xs text-gray-500">x {quantity}</span>{" "}
                    <span className="font-bold">
                      = {currency}
                      {itemTotal.toFixed(2)}
                    </span>
                  </p>
                  {notes && (
                    <p className="mt-1 text-xs text-gray-400">Notes: {notes}</p>
                  )}

                  {variant && (
                    <p className="mt-1 text-xs text-gray-400">
                      Variant: {variant.title}
                    </p>
                  )}
                  {addons && addons?.length > 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      Addons:{" "}
                      {addons.map((addon) => `${addon.title}`)?.join(", ")}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 w-full mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          minusCartItemQuantity(i, quantity);
                        }}
                        className="btn btn-circle btn-sm"
                      >
                        <IconMinus stroke={iconStroke} size={18} />
                      </button>
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                        {quantity}
                      </div>
                      <button
                        onClick={() => {
                          addCartItemQuantity(i, quantity);
                        }}
                        className="btn btn-circle btn-sm"
                      >
                        <IconPlus stroke={iconStroke} size={18} />
                      </button>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          btnOpenNotesModal(i, notes);
                        }}
                        className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
                      >
                        <div>
                          <IconNote size={18} stroke={iconStroke} />
                        </div>{" "}
                        <p>Notes</p>
                      </button>
                    </div>
                  </div>

                  {/* action btn delete */}
                  <button
                    onClick={() => {
                      removeItemFromCart(i);
                    }}
                    className="absolute right-2 top-2 text-red-500 flex items-center justify-center rounded-full w-6 h-6 hover:bg-red-100 transition"
                  >
                    <IconTrash stroke={iconStroke} size={14} />
                  </button>
                  {/* action btn delete */}
                </div>
              );
            })}
          </div>
          {/* items */}

          {/* actions */}
          <div className="absolute w-full bottom-0 pb-4 rounded-b-2xl px-4 bg-white/20 backdrop-blur border-t">
            <div className="flex items-center flex-col lg:flex-row gap-2 mt-4">
              <button
                onClick={btnOpenSaveDraftModal}
                className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex-1 lg:flex-none flex items-center gap-1"
              >
                <IconDeviceFloppy size={18} stroke={iconStroke} /> Draft
              </button>

              <button
                onClick={btnShowSendToKitchenModal}
                className="text-sm rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex-1 flex justify-center items-center gap-1"
              >
                <div>
                  <IconChefHat size={18} stroke={iconStroke} />
                </div>{" "}
                <p>Send to Kitchen</p>
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={btnShowPayAndSendToKitchenModal}
                className="text-sm rounded-lg border border-transparent bg-restro-green text-white hover:bg-restro-green-dark transition active:scale-95 hover:shadow-lg px-2 py-1 w-full flex items-center justify-center gap-1"
              >
                <div>
                  <IconCash size={18} stroke={iconStroke} />
                </div>{" "}
                <p>Create Receipt & Pay</p>
              </button>
            </div>
          </div>
          {/* actions */}
        </div>
        {/* cart */}
      </div>

      {/* dialog: notes */}
      <dialog id="modal-notes" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Add Notes</h3>

          <div className="my-4">
            <input type="hidden" ref={dialogNotesIndexRef} />
            <label
              htmlFor="dialogNotesText"
              className="mb-1 block text-gray-500 text-sm"
            >
              Notes{" "}
              <span className="text-xs text-gray-500">
                (100 character max.)
              </span>
            </label>
            <input
              ref={dialogNotesTextRef}
              type="text"
              name="dialogNotesText"
              id="dialogNotesText"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Notes here..."
            />
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={() => {
                  btnAddNotes();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: notes */}

      {/* dialog: category selection */}
      <dialog
        id="modal-categories"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Filters</h3>

          <div className="my-4">
            <label
              htmlFor="select_category"
              className="mb-1 block text-gray-500 text-sm"
            >
              Select Category
            </label>
            <select
              ref={categoryFilterDropdownRef}
              type="text"
              name="select_category"
              id="select_category"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Category..."
            >
              <option value="all">All</option>
              {categories?.map((category, index) => (
                <option value={category.id} key={index}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  btnClearSelectedCategory();
                }}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnApplyCategoryFilter();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: category selection */}

      {/* dialog: variants & addons */}
      <dialog
        id="modal-variants-addons"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Select Variant & Addons</h3>

          <div className="my-4 flex gap-2">
            <div className="flex-1">
              <h3>Variants</h3>
              <div className="flex flex-col gap-2 mt-2">
                {menuItems
                  .find((item) => item.id == selectedItemId)
                  ?.variants?.map((variant, index) => {
                    const { id, item_id, title, price } = variant;
                    return (
                      <label
                        key={index}
                        className="cursor-pointer label justify-start gap-2"
                      >
                        <input
                          type="radio"
                          className="radio"
                          name="variants"
                          id=""
                          value={id}
                          defaultChecked={index == 0}
                        />
                        <span className="label-text">
                          {title} - {currency}
                          {price}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
            <div className="flex-1">
              <h3>Addons</h3>
              <div className="flex flex-col gap-2 mt-2">
                {menuItems
                  .find((item) => item.id == selectedItemId)
                  ?.addons?.map((addon, index) => {
                    const { id, item_id, title, price } = addon;
                    return (
                      <label
                        key={index}
                        className="cursor-pointer label justify-start gap-2"
                      >
                        <input
                          type="checkbox"
                          name="addons"
                          id=""
                          className="checkbox  checkbox-sm"
                          value={id}
                        />
                        <span className="label-text">
                          {title} (+{currency}
                          {price})
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={() => {
                  btnAddMenuItemToCartWithVariantsAndAddon();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: variants & addons */}

      {/* dialog: save draft */}
      <dialog
        id="modal-save-draft"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Save Cart Items to Drafts</h3>

          <div className="my-4">
            <label
              htmlFor="draftTitleRef"
              className="mb-1 block text-gray-500 text-sm"
            >
              Reference
            </label>
            <input
              ref={draftTitleRef}
              type="text"
              name="draftTitleRef"
              id="draftTitleRef"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Reference Name here..."
            />
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={() => {
                  btnAddtoDrafts();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: save draft */}

      {/* dialog: drafts list */}
      <dialog id="modal-drafts" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box p-0">
          <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur px-6 py-4">
            <h3 className="font-bold text-lg">Drafts</h3>
            <form method="dialog" className="flex gap-2">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={btnClearDrafts}
                className="rounded-full hover:bg-red-200 transition active:scale-95 bg-red-50 text-red-500 w-9 h-9 flex items-center justify-center"
              >
                <IconClearAll stroke={iconStroke} />
              </button>
              <button className="rounded-full hover:bg-gray-200 transition active:scale-95 bg-gray-100 text-gray-500 w-9 h-9 flex items-center justify-center">
                <IconX stroke={iconStroke} />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-6">
            {drafts?.map((draftItem, index) => {
              const { nameRef, date, cart } = draftItem;

              return (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded-2xl p-2 border"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                    <IconClipboardList stroke={iconStroke} />
                  </div>
                  <div className="flex-1">
                    <p>Ref: {nameRef}</p>
                    <p className="text-xs">{cart?.length} Cart Items</p>
                    <p className="text-xs text-gray-500">{date}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        btnSelectDraftItemToCart(draftItem);
                      }}
                      className="rounded-full transition active:scale-95 text-restro-green w-6 h-6 bg-green-50 hover:bg-restro-green-dark hover:text-white flex items-center justify-center"
                    >
                      <IconPencil size={14} stroke={iconStroke} />
                    </button>

                    <button
                      onClick={() => {
                        btnDeleteDraftItem(index);
                      }}
                      className="rounded-full transition active:scale-95 text-red-500 w-6 h-6 bg-red-50 hover:bg-red-200 flex items-center justify-center"
                    >
                      <IconTrash size={14} stroke={iconStroke} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </dialog>
      {/* dialog: drafts list */}

      <DialogAddCustomer
        defaultValue={state.addCustomerDefaultValue}
        onSuccess={(phone, name) => {
          setCustomer({ value: phone, label: `${name} - (${phone})` });
          document.getElementById("modal-search-customer").close();
        }}
      />

      {/* dialog: search customer */}
      <dialog
        id="modal-search-customer"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box h-96">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Search Customer</h3>
            <form method="dialog">
              <button
                onClick={btnClearSearchCustomer}
                className="btn btn-circle btn-sm bg-gray-50 hover:bg-gray-100 text-gray-500 border-none"
              >
                <IconRotate size={18} stroke={iconStroke} />
              </button>
              <button className="ml-2 btn btn-circle btn-sm bg-red-50 hover:bg-red-100 text-red-500 border-none">
                <IconX size={18} stroke={iconStroke} />
              </button>
            </form>
          </div>

          <div className="my-4 flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="searchCustomerRef"
                className="mb-1 block text-gray-500 text-sm"
              >
                Search Customer
              </label>
              {/* <input ref={searchCustomerRef} type="search" name="searchCustomerRef" id='searchCustomerRef' className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light" placeholder="Enter Customer Phone here..." /> */}
              <AsyncCreatableSelect
                menuPlacement="auto"
                loadOptions={searchCustomersAsync}
                isClearable
                noOptionsMessage={(v) => {
                  return "Type something to find...";
                }}
                onChange={(v) => {
                  setCustomer(v);
                }}
                onCreateOption={(inputValue) => {
                  setState({
                    ...state,
                    addCustomerDefaultValue: inputValue,
                  });
                  document.getElementById("modal-add-customer").showModal();
                }}
              />
            </div>
          </div>
        </div>
      </dialog>
      {/* dialog: search customer */}

      {/* dialog: send to kitchen summary */}
      <dialog
        id="modal-send-kitchen-summary"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Send order to Kitchen</h3>

          <div className="my-4 flex items-center divide-x w-full">
            <div className="flex-1">
              <p>Items Net Total</p>
              <p className="text-lg">
                {currency}
                {state.itemsTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 pl-4">
              <p>Tax Total</p>
              <p className="text-lg">
                +{currency}
                {state.taxTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 pl-4">
              <p>Payable Total</p>
              <p className="text-lg font-bold text-restro-green">
                {currency}
                {state.payableTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={btnSendToKitchen}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Send to Kitchen
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: send to kitchen summary */}

      {/* dialog: collect payment & send to kitchen summary */}
      <dialog
        id="modal-pay-and-send-kitchen-summary"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              Collect Payment & Send order to Kitchen
            </h3>
            <form method="dialog">
              <button className="hover:bg-red-100 border-none transition active:scale-95 bg-red-50 text-red-500 btn btn-sm btn-circle">
                <IconX size={18} stroke={iconStroke} />
              </button>
            </form>
          </div>

          <div className="my-6 flex items-center justify-center divide-x w-full">
            <div className="flex-1 text-center">
              <p>Items Net Total</p>
              <p className="text-lg">
                {currency}
                {state.itemsTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 text-center">
              <p>Tax Total</p>
              <p className="text-lg">
                +{currency}
                {state.taxTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 text-center">
              <p>Payable Total</p>
              <p className="text-lg font-bold text-restro-green">
                {currency}
                {state.payableTotal.toFixed(2)}
              </p>
            </div>
          </div>

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

          <div className="modal-action flex items-center justify-center w-full">
            <form method="dialog" className="w-full">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={() => {
                  btnPayAndSendToKitchen();
                }}
                className="w-full text-center rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white"
              >
                Collect Payment & Send to Kitchen
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: collect payment & send to kitchen summary */}

      {/* dialog: print-token */}
      <dialog
        id="modal-print-token"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg text-center">
            Order sent to Kitchen!
          </h3>

          <div className="my-8 mx-auto w-fit">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center bg-restro-green text-white rounded-full">
                <IconCheck stroke={iconStroke} size={32} />
              </div>
              <p className="font-bold text-5xl">#{state?.tokenNo}</p>
            </div>

            <p className="text-sm mt-4 text-center">
              Order ID: {state?.orderId}
            </p>
          </div>

          <div className="modal-action justify-center">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={btnPrintTokenOnly}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Print Token
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* dialog: print-token */}

      {/* dialog: qrorders */}
      <dialog
        id="modal-qrorders"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box p-0">
          <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur px-6 py-4">
            <h3 className="font-bold text-lg">QR Orders</h3>
            <form method="dialog" className="flex gap-2">
              {/* if there is a button in form, it will close the modal */}
              <button
                onClick={btnClearQROrders}
                className="rounded-full hover:bg-red-200 transition active:scale-95 bg-red-50 text-red-500 w-9 h-9 flex items-center justify-center"
              >
                <IconClearAll stroke={iconStroke} />
              </button>
              <button className="rounded-full hover:bg-gray-200 transition active:scale-95 bg-gray-100 text-gray-500 w-9 h-9 flex items-center justify-center">
                <IconX stroke={iconStroke} />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-6">
            {state?.qrOrders?.map((qrOrder, index) => {
              const {
                customer_type,
                customer_id,
                customer_name,
                table_id,
                table_title,
                items,
                id,
              } = qrOrder;

              return (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded-2xl p-2 border"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                    <IconClipboardList stroke={iconStroke} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <IconArmchair2 stroke={iconStroke} size={14} />
                      <p className="">{table_title || "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <IconUser stroke={iconStroke} size={14} />
                      <p className="">
                        {customer_type == "WALKIN" ? "WALKIN" : customer_name}
                      </p>
                    </div>
                    <p className="text-xs">{items?.length} Cart Items</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        btnSelectQROrder(qrOrder);
                      }}
                      className="rounded-full transition active:scale-95 text-restro-green w-6 h-6 bg-green-50 hover:bg-restro-green-dark hover:text-white flex items-center justify-center"
                    >
                      <IconPencil size={14} stroke={iconStroke} />
                    </button>

                    <button
                      onClick={() => {
                        btnCancelQROrder(id);
                      }}
                      className="rounded-full transition active:scale-95 text-red-500 w-6 h-6 bg-red-50 hover:bg-red-200 flex items-center justify-center"
                    >
                      <IconTrash size={14} stroke={iconStroke} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </dialog>
      {/* dialog: qrorders */}
    </Page>
  );
}
