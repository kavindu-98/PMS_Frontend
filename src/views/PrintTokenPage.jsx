/** @format */

import React from "react";
import { getDetailsForReceiptPrint } from "../helpers/ReceiptHelper";
import { useTranslation } from "react-i18next";

export default function PrintTokenPage() {
  const { t } = useTranslation();
  const receiptDetails = getDetailsForReceiptPrint();

  const {
    cartItems,
    deliveryType,
    customerType,
    customer,
    tableId,
    selectedTable,
    currency,
    storeSettings,
    printSettings,
    itemsTotal,
    taxTotal,
    serviceChargeTotal,
    payableTotal,
    tokenNo,
    orderId,
    paymentMethod,
    cashierName,
  } = receiptDetails;

  // const {
  //   store_name,
  //   address,
  //   phone,
  //   email,
  //   image: storeImage,
  // } = storeSettings;

  // const {
  //   page_format,
  //   header,
  //   footer,
  //   show_notes,
  //   show_store_details,
  //   show_customer_details,
  //   print_token,
  // } = printSettings;

  const page_format = printSettings?.page_format || 80;

  // Check if this is a kitchen flow (no payment method means it's from send to kitchen)
  const isKitchenFlow = !paymentMethod;

  return (
    <div className={`w-[${page_format}mm] font-sans px-2 bg-white text-black`}>
      {/* Customer Name - Display at top when customer is selected */}
      {customer && customer.name && (
        <div className="text-center mt-2 mb-4">
          <p className="text-lg font-semibold">{customer.name}</p>
        </div>
      )}

      {/* Show additional details for kitchen flow when print settings are disabled */}
      {isKitchenFlow && (
        <>
          {/* Order Type */}
          <p className="mt-2">
            {t("print_receipt.order_type")}: {deliveryType}
          </p>

          {/* Table Information - Display below Order Type when table is selected */}
          {selectedTable && (
            <p className="mt-1">
              {t("pos.table")}: {selectedTable.table_title} (
              {selectedTable.seating_capacity} {t("pos.person")}) -{" "}
              {selectedTable.floor}
            </p>
          )}

          {/* Receipt No */}
          <p className="mt-1">
            {t("print_receipt.receipt_no")}: {tokenNo}-
            {new Date().toISOString().substring(0, 10)}
          </p>

          {/* Date and Time */}
          <p className="mt-1">{new Date().toLocaleString()}</p>

          <div className="border-b border-dashed mt-2"></div>

          {/* Product Details */}
          {cartItems &&
            cartItems.map((cartItem, index) => {
              const {
                title,
                quantity,
                price,
                addons,
                addons_ids,
                variant,
                weight,
              } = cartItem;

              return (
                <div key={index} className="w-full my-2">
                  <p className="font-semibold">
                    {title} {variant && <span>- {variant.title}</span>}
                  </p>

                  {/* Weight if available */}
                  {weight && (
                    <p className="text-sm text-gray-600">Weight: {weight}</p>
                  )}

                  {/* Addons */}
                  {addons_ids?.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">
                        {t("print_receipt.addons")}:
                      </p>
                      {addons_ids.map((addonId, addonIndex) => {
                        const addon = addons?.find((a) => a.id == addonId);
                        return addon ? (
                          <p key={addonIndex} className="ml-2">
                            • {addon.title}
                          </p>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex justify-between w-full mt-1">
                    <p className="text-sm font-semibold">
                      {t("pos.quantity")}: {quantity}
                    </p>
                  </div>
                </div>
              );
            })}

          <div className="border-b border-dashed mt-4"></div>
        </>
      )}

      <div className="mt-4 py-8 text-center">
        {t("print_token.token_no")}
        <div className="w-28 h-28 mx-auto border-black border-2 text-black flex items-center justify-center font-bold text-4xl rounded-full">
          {tokenNo}
        </div>
      </div>

      <p className="mt-2 text-center">
        {new Date().toLocaleString("en-US", {
          hour12: true,
          dateStyle: "long",
          timeStyle: "short",
        })}
      </p>
    </div>
  );
}
