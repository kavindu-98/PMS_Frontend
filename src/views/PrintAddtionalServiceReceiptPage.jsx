/** @format */

import React from "react";
import { getDetailsForAddtionalServiceReceiptPrint } from "../helpers/ReceiptHelper";

export default function PrintDayOutReceiptPage() {
  const receiptDetails = getDetailsForAddtionalServiceReceiptPrint();

  console.log("Receipt Data:", receiptDetails);

  const {
    serviceItems,
    currency,
    storeSettings,
    printSettings,
    itemsTotal,
    taxTotal,
    grandTotal,
    serviceCharge,
    advanceTotal,
    orderId,
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
      {/* {show_customer_details === 1 && dayOutDetails?.length > 0 && (
        <div>
          <div className="border-b border-dashed"></div>
          <p className="text-center">
            {dayOutDetails[0]?.customer?.type}
            {dayOutDetails[0]?.customer?.id && (
              <span>, {dayOutDetails[0]?.customer?.name}</span>
            )}
          </p>
        </div>
      )} */}

      <div className="border-b border-dashed mt-2"></div>
      <p>
        Receipt No.: {orderId}-{new Date().toISOString().substring(0, 10)}
      </p>
      <p>{new Date().toLocaleString()}</p>

      {/* Dayout & Order Details Section */}
      <div className="w-full my-2">
        <div className="mt-2 border-b border-dashed"></div>

        {/* Service Items */}
        {serviceItems &&
          serviceItems?.map((service, serviceIdx) => (
            <div key={serviceIdx} className="w-full my-2">
              {service.items.map((serviceItem, idx) => (
                <div key={idx} className="w-full my-1">
                  <p>
                    {serviceItem.services} - {serviceItem.subServices}
                  </p>
                  <div className="flex justify-between w-full">
                    <p className="text-sm">
                      {currency}
                      {Number(serviceItem.price).toFixed(2)} x{" "}
                      {serviceItem.count}
                    </p>
                    <p className="text-end">
                      {currency}
                      {(
                        Number(serviceItem.price) * Number(serviceItem.count)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}

        <div className="mt-2 border-b border-dashed"></div>
      </div>

      {/* Summary Section */}
      <div className="flex justify-between">
        <p>Total Advance:</p>
        <p>
          {currency}
          {Number(advanceTotal).toFixed(2)}
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
      <div className="flex justify-between">
        <p>Service Charge: </p>
        <p>
          {currency}
          {Number(serviceCharge).toFixed(2)}
        </p>
      </div>

      <div className="flex justify-between text-xl font-bold">
        <p>Total: </p>
        <p>
          {currency}
          {Number(grandTotal).toFixed(2)}
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
