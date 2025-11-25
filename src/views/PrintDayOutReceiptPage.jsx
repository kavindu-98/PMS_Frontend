/** @format */

import React from "react";
import { getDetailsForDayOutReceiptPrint } from "../helpers/ReceiptHelper";

export default function PrintDayOutReceiptPage() {
  const receiptDetails = getDetailsForDayOutReceiptPrint();

  console.log("Receipt Data:", receiptDetails);

  const {
    cartItems,
    serviceItems,
    currency,
    storeSettings,
    printSettings,
    dayOutDetails,
    itemsTotal,
    taxTotal,
    payableTotal,
    packageName,
    check_in_time,
    check_out_time,
    customer_name,
    guest_count,
    note,
    packagePrice,
    packageTaxAmount,
    totalServiceCharge,
    price_per_person,
    advanceAmount,
    reservation_id,
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

  return (
    <div className={`w-[${page_format}mm] font-sans px-2`}>
      {show_store_details == 1 ? (
        <>
          {storeImage && <img src={storeImage} className="w-12 h-12 mx-auto" />}
          <p className="text-center mt-2">
            {store_name}
            <br />
            {address}
            <br />
            Phone: {phone}, Email: {email}
            <br />
          </p>
        </>
      ) : (
        <></>
      )}

      {header && (
        <div className="">
          <div className="border-b border-dashed"></div>
          <p className="my-2 text-center">{header}</p>
        </div>
      )}

      {/* Customer Details (Displayed Once) */}
      {show_customer_details === 1 && (
        <div>
          <div className="border-b border-dashed"></div>
          <p className="text-center">
            {/* {dayOutDetails[0]?.customer?.type} */}
            {customer_name && <span>Customer Name: {customer_name}</span>}
          </p>
        </div>
      )}

      <div className="border-b border-dashed mt-2"></div>
      <p>
        Receipt No: {reservation_id}-{new Date().toISOString().substring(0, 10)}
      </p>
      <p>{new Date().toLocaleString()}</p>

      <div className="mt-2 border-b border-dashed"></div>
      <div className="mt-2 border-b border-dashed"></div>

      {/* Dayout & Order Details Section */}
      <div className="w-full my-2">
        {/* Dayout Info */}
        <p className="font-bold">Reservation ID: {reservation_id}</p>
        <p>Package Name: {packageName || "N/A"}</p>
        <p>Check-In: {check_in_time}</p>
        <p>Check-Out: {check_out_time}</p>

        {show_notes === 1 && note && <p className="text-xs">Notes: {note}</p>}

        <div className="w-full my-1">
          <p>{packageName} </p>
          <div className="flex justify-between w-full">
            <p className="text-sm">
              {currency}
              {Number(price_per_person).toFixed(2)} x {guest_count}
            </p>
            <p className="text-end">
              {currency}
              {(Number(price_per_person) * guest_count).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-2 border-b border-dashed"></div>

        {/* Order Items for the resevationID */}
        {cartItems?.map((cartItem, idx) => {
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
            <div key={idx} className="w-full my-1">
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
                  {currency}
                  {Number(cartItem.price).toFixed(2)} x {cartItem.quantity}
                </p>
                <p className="text-end">
                  {currency}
                  {(Number(cartItem.price) * cartItem.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}

        <div className="mt-2 border-b border-dashed"></div>

        {/* Service Items */}
        {serviceItems[reservation_id] &&
          serviceItems[reservation_id]?.items?.map((serviceItem, idx) => (
            <div key={idx} className="w-full my-1">
              <p>
                {serviceItem.services} - {serviceItem.sub_services}
              </p>
              <div className="flex justify-between w-full">
                <p className="text-sm">
                  {currency}
                  {Number(serviceItem.price).toFixed(2)} x {serviceItem.count}
                </p>
                <p className="text-end">
                  {currency}
                  {(Number(serviceItem.price) * serviceItem.count).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

        <div className="mt-2 border-b border-dashed"></div>
      </div>

      {/* Summary Section */}
      <div className="flex justify-between">
        <p>Total Advance:</p>
        <p>
          {currency}
          {Number(advanceAmount).toFixed(2)}
        </p>
      </div>

      <div className="flex justify-between">
        <p>Subtotal (excl. tax): </p>
        <p>
          {currency}
          {Number(itemsTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p>Tax: </p>
        <p>
          {currency}
          {Number(taxTotal).toFixed(2)}
        </p>
      </div>
      {/* <div className="flex justify-between">
        <p>Discount: </p>
        <p>
          {currency}
          {Number(discount || 0).toFixed(2)}
        </p>
      </div> */}
      <div className="flex justify-between">
        <p>Service Charge: </p>
        <p>
          {currency}
          {Number(totalServiceCharge || 0).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between text-xl font-bold">
        <p>Total: </p>
        <p>
          {currency}
          {Number(payableTotal).toFixed(2)}
        </p>
      </div>

      <div className="border-b border-dashed mt-2"></div>

      {footer && (
        <div className="my-2">
          <p className="my-2 text-center">{footer}</p>
        </div>
      )}
    </div>
  );
}
