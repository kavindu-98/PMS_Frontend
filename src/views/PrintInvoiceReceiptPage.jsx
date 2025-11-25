/** @format */

import React from "react";
import { getDetailsForInvoiceReceiptPrint } from "../helpers/ReceiptHelper";

export default function PrintInvoiceReceiptPage() {
  const receiptDetails = getDetailsForInvoiceReceiptPrint();

  console.log("Receipt Data:", receiptDetails);

  const {
    cartItems,
    additionalServices,
    roomDetails,
    currency,
    storeSettings,
    printSettings,
    dayOutDetails,
    discount,
    itemsTotal,
    taxTotal,
    payableTotal,
    serviceCharge,
    tokenNo,
    advanceTotal,
    paymentMethod,
  } = receiptDetails;

  const {
    store_name,
    address,
    phone,
    email,
    image: storeImage,
  } = storeSettings;

  const {
    page_format,
    header,
    footer,
    show_notes,
    show_store_details,
    show_customer_details,
    print_token,
  } = printSettings;

  console.log("receiptDetails receiptDetails", receiptDetails);
  console.log("show_customer_details", show_customer_details);
  console.log(
    "additional_services",
    additionalServices[0]?.items[0]?.subServiceName
  );

  return (
    <div className={`w-[${page_format}mm] font-sans px-2`}>
      {/* Store Details */}
      {show_store_details === 1 && (
        <>
          {storeImage && <img src={storeImage} className="w-12 h-12 mx-auto" />}
          <p className="mt-2 text-center">
            {store_name}
            <br />
            {address}
            <br />
            Phone: {phone}, Email: {email}
          </p>
        </>
      )}

      {/* Header */}
      {header && (
        <div>
          <div className="border-b border-dashed"></div>
          <p className="my-2 text-center">{header}</p>
        </div>
      )}

      {/* Customer Details */}

      {show_customer_details === 1 && roomDetails && (
        <div>
          <div className="border-b border-dashed"></div>
          <p className="text-center">
            <span>{roomDetails.customer.id}</span>
          </p>
        </div>
      )}

      {/* Room Details */}
      <div className="border-b border-dashed mt-2"></div>
      <p>
        Receipt No.:{" "}
        {cartItems?.length > 0 && cartItems[0].tokenNo
          ? cartItems[0].tokenNo
          : "N/A"}{" "}
        - {new Date().toISOString().substring(0, 10)}
      </p>
      <p>{new Date().toLocaleString()}</p>

      <div className="mt-2 border-b border-dashed"></div>

      {/* Room Booking Info */}
      {roomDetails && (
        <div className="w-full my-2">
          <p className="font-bold">Room No.: {roomDetails.roomNo}</p>
          <p>Booking Type: {roomDetails.bookingType || "N/A"}</p>
          <p>Check-In: {roomDetails.checkIn}</p>
          <p>Check-Out: {roomDetails.checkOut}</p>
          <p>Status: {roomDetails.status}</p>

          {show_notes === 1 && roomDetails.note && (
            <p className="text-xs">Notes: {roomDetails.note}</p>
          )}
        </div>
      )}
      {roomDetails && (
        <div className="flex justify-between w-full font-bold">
          <p>Room Price:</p>
          <p>
            {currency}
            {Number(roomDetails.finalPrice).toFixed(2)}
          </p>
        </div>
      )}

      <div className="mt-2 border-b border-dashed"></div>

      {/* Ordered Food Items */}
      {cartItems.map((cartItem, index) => {
        const {
          title,
          quantity,
          notes,
          price,
          tax_rate,
          tax_type,
          tax_title,
          addons,
          addons_ids,
          variant,
        } = cartItem;

        return (
          <div key={index} className="w-full my-1">
            <p>
              {title} {variant && <span>- {variant.title}</span>}
            </p>
            {addons_ids?.length > 0 && (
              <p className="text-xs">
                Addons:
                {addons_ids
                  .map((addonId, index) => {
                    const addon = addons.find((a) => a.id == addonId);
                    return addon.title;
                  })
                  ?.join(", ")}
              </p>
            )}
            {show_notes == 1 && notes ? (
              <p className="mb-2 text-xs">Notes: {notes}</p>
            ) : (
              <></>
            )}
            <div className="flex justify-between w-full">
              <p className="text-sm">
                {quantity}x {currency}
                {Number(price).toFixed(2)}
              </p>
              <p className="text-end">
                {currency}
                {Number(quantity * price).toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}

      <div className="mt-2 border-b border-dashed"></div>

      {/* Additional Services */}
      {additionalServices?.map((service, idx) => (
        <div key={idx} className="w-full my-1">
          {service.items.map((item, i) => (
            <div key={i}>
              <p>{item.subServiceName}</p>
              <div className="flex justify-between w-full">
                <p className="text-sm">
                  {currency}
                  {Number(item.price).toFixed(2)} x {item.count}
                </p>
                <p className="text-end">
                  {currency}
                  {(Number(item.price) * Number(item.count)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-2 border-b border-dashed"></div>

      {/* Summary Section */}
      <div className="flex justify-between">
        <p>Total Advance:</p>
        <p>
          {currency}
          {Number(roomDetails?.advanced_amount ?? 0).toFixed(2)}
        </p>
      </div>

      <div className="flex justify-between">
        <p>Subtotal (excl. tax):</p>
        <p>
          {currency}
          {Number(itemsTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p>Tax:</p>
        <p>
          {currency}
          {Number(taxTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p>Service Charge:</p>
        <p>
          {currency}
          {Number(serviceCharge).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p>Discount:</p>
        <p>
          {currency}
          {Number(discount || 0).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between text-xl font-bold">
        <p>Total Payable:</p>
        <p>
          {currency}
          {Number(payableTotal).toFixed(2)}
        </p>
      </div>

      <div className="border-b border-dashed mt-2"></div>

      {/* Footer */}
      {footer && (
        <div className="my-2">
          <p className="my-2 text-center">{footer}</p>
        </div>
      )}
    </div>
  );
}
