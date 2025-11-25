/** @format */

import React from "react";
import { getDetailsForHallReceiptPrint } from "../helpers/ReceiptHelper";

export default function PrintHallReceiptPage() {
  const receiptDetails = getDetailsForHallReceiptPrint();

  const {
    currency,
    storeSettings,
    printSettings,
    packageName,
    guestCount,
    pricePerPerson,
    itemsTotal,
    taxTotal,
    payableTotal,
    ReservationId
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

  console.log("receiptDetails", receiptDetails);

  return (
    <div className={`w-[${page_format}mm] font-sans px-2`}>
      {show_store_details == 1 ? (
        <>
          {storeImage && <img src={storeImage} className="w-12 h-12 mx-auto" />}
          <p className="mt-2 text-center">
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

      {/* {show_customer_details == 1 ? (
        <>
          <div className="border-b border-dashed"></div>
          <p className="text-center">
            {customerType}
            {customer && <span>, {customer?.name}</span>}
          </p>
          <p className="mt-1">Order Type: {deliveryType}</p>
        </>
      ) : (
        <></>
      )} */}
{/* 
      {paymentMethod && (
        <>
          <div className="border-b border-dashed"></div>
          <p className="mt-1">Payment Method: {paymentMethod}</p>
        </>
      )} */}

      <div className="mt-2 border-b border-dashed"></div>
      <p>
        Receipt No.: {ReservationId}-{new Date().toISOString().substring(0, 10)}
      </p>
      <p>{new Date().toLocaleString()}</p>

      <div className="mt-2 border-b border-dashed"></div>
      {/* {cartItems.map((cartItem, index) => {
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
      })} */}
      <div className="w-full my-1">
            <p>
              {packageName} 
            </p>
            <p>
              Guest Count : {guestCount} 
            </p>
            <p>
              Price Per Person :  {currency}.{pricePerPerson} 
            </p>
            </div>
      <div className="mt-2 border-b border-dashed"></div>

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
          {Number(discount).toFixed(2)}
        </p>
      </div> */}
      <div className="flex justify-between text-xl font-bold">
        <p>Total: </p>
        <p>
          {currency}
          {Number(payableTotal).toFixed(2)}
        </p>
      </div>

      <div className="mt-2 border-b border-dashed"></div>

      {footer && (
        <div className="my-2">
          <p className="my-2 text-center">{footer}</p>
        </div>
      )}

      {/* {print_token == 1 && tokenNo ? (
        <div className="py-12 mt-4 text-center border-t border-dashed">
          Token No.
          <div className="flex items-center justify-center mx-auto text-4xl font-bold text-black border-2 border-black rounded-full w-28 h-28">
            {tokenNo}
          </div>
        </div>
      ) : (
        <></>
      )} */}
    </div>
  );
}
