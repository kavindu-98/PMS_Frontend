/** @format */

import React from "react";
import { getDetailsForRoomReceiptPrint } from "../helpers/ReceiptHelper";

export default function PrintRoomReceiptPage() {
  const receiptDetails = getDetailsForRoomReceiptPrint();
  console.log("Receipt Data:", receiptDetails);

  const {
    cartItems,
    serviceItems,
    currency,
    storeSettings,
    printSettings,
    itemsTotal,
    taxTotal,
    payableTotal,
    roomDetails,
    tokenNo,
    advanceTotal,
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

      {header && (
        <>
          <div className="border-b border-dashed"></div>
          <p className="my-2 text-center">{header}</p>
        </>
      )}

      {/* Customer Details (Displayed Once) */}
      {show_customer_details === 1 && roomDetails?.length > 0 && (
        <div>
          <div className="border-b border-dashed"></div>
          <p className="text-center">
            {roomDetails[0]?.customer?.type}
            {roomDetails[0]?.customer?.id && (
              <span>, {roomDetails[0]?.customer?.name}</span>
            )}
          </p>
        </div>
      )}

      <div className="mt-2 border-b border-dashed"></div>
      <p>
        Receipt No.: {tokenNo}-{new Date().toLocaleString()}
      </p>
      <div className="mt-2 border-b border-dashed"></div>
      <div className="mt-2 border-b border-dashed"></div>

      {/* Room & Order Details Section */}
      {roomDetails?.map((room, index) => (
        <div key={index} className="w-full my-2">
          {/* Room Info */}
          <p className="font-bold">Room No: {room.roomNo}</p>
          <p>Booking Type: {room.bookingType}</p>
          <p>Check-In: {room.checkIn}</p>
          <p>Check-Out: {room.checkOut}</p>
          <p>Status: {room.status}</p>

          {show_notes === 1 && room.note && (
            <p className="text-xs">Notes: {room.note}</p>
          )}

          <div className="flex justify-between w-full font-bold">
            <p>Room Price:</p>
            <p>
              {currency}
              {Number(room.finalPrice).toFixed(2)}
            </p>
          </div>

          <div className="mt-2 border-b border-dashed"></div>
          {/* Order Items for the Room */}
          {serviceItems[room.roomNo]?.map((service, idx) => (
            <div key={idx} className="w-full my-1">
              {service.items.map((item, itemIdx) => (
                <div key={itemIdx}>
                  <p>{item.sub_services}</p>
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

          {/* Order Items for the Room */}
          {cartItems[room.roomNo]?.map((cartItem, idx) => (
            <div key={idx} className="w-full my-1">
              <p>
                {cartItem.title}{" "}
                {cartItem.variant && `- ${cartItem.variant.title}`}
              </p>
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
          ))}

          <div className="mt-2 border-b border-dashed"></div>
        </div>
      ))}

      {/* Summary Section */}
      <div className="flex justify-between">
        <p>Total Advance:</p>
        <p>
          {currency}
          {Number(advanceTotal).toFixed(2)}
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

      <div className="flex justify-between text-xl font-bold">
        <p>Total:</p>
        <p>
          {currency}
          {Number(payableTotal).toFixed(2)}
        </p>
      </div>

      <div className="mt-2 border-b border-dashed"></div>

      {/* Footer */}
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
