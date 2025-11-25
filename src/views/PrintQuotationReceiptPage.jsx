/** @format */

import React, { useEffect } from "react";
import { getDetailsForQuotationReceiptPrint } from "../helpers/ReceiptHelper";

export default function PrintQuotationReceiptPage() {
  const receiptDetails = getDetailsForQuotationReceiptPrint();

  // Destructure necessary fields
  const {
    bookingDetails = [],
    subtotal = 0,
    taxTotal = 0,
    serviceCharge = 0,
    finalTotal = 0,
    storeSettings = [],
    printSettings = [],
    currency,
    customer,
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

  useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  return (
    <div className="w-full max-w-[210mm] mx-auto p-6 font-sans print:bg-white print:text-black print:w-full">
      {/* Store Details */}
      {storeImage && (
        <img src={storeImage} className="w-12 h-12 mx-auto" alt="Store Logo" />
      )}
      <p className="mt-2 text-center">
        {store_name}
        <br />
        {address}
        <br />
        Phone: {phone}, Email: {email}
        <br />
      </p>

      <div className="border-b border-dashed"></div>

      <p className="text-center">{customer && <span>{customer?.name}</span>}</p>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold">Quotation Receipt</h2>
        <p className="text-sm">Date: {new Date().toLocaleString()}</p>
      </div>

      <hr className="my-2 border-dashed" />

      {/* Booking Details Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-collapse">
          <thead>
            <tr className="bg-gray-200 print:bg-gray-100">
              <th className="px-2 py-2 text-start w-[5%]">#</th>
              <th className="px-2 py-2 text-start w-[10%]">ID</th>
              <th className="px-2 py-2 text-start w-[25%]">Description</th>
              <th className="px-2 py-2 text-center w-[8%]">People</th>
              <th className="px-2 py-2 text-end w-[12%]">Unit Price</th>
              <th className="px-2 py-2 text-end w-[12%]">Amount</th>
              <th className="px-2 py-2 text-end w-[12%]">Exclude Price</th>
            </tr>
          </thead>
          <tbody>
            {bookingDetails?.map((booking, index) => (
              <tr key={index} className="text-sm border-b">
                <td className="px-2 py-1">{index + 1}</td>
                <td className="px-2 py-1 break-all">
                  {booking.roomId ? `R: ${booking.roomId} ` : ""}
                  {booking.hallPackageId ? `H: ${booking.hallPackageId} ` : ""}
                  {booking.packageId ? `D: ${booking.packageId} ` : ""}
                  {booking.serviceId ? `S: ${booking.serviceId} ` : ""}
                </td>
                <td className="px-2 py-1 break-words">
                  {booking.roomType ? booking.roomType : ""}
                  {booking.bookingCategory
                    ? ` | ${booking.bookingCategory}`
                    : ""}
                  {booking.subService ? ` | ${booking.subService}` : ""}
                  {booking.notes ? ` | ${booking.notes}` : ""}
                  {booking.weddingPackageName
                    ? ` | ${booking.weddingPackageName}`
                    : ""}
                  {booking.dayoutPackageName
                    ? ` | ${booking.dayoutPackageName}`
                    : ""}
                  {booking.additionalPackageName
                    ? ` | ${booking.additionalPackageName}`
                    : ""}
                </td>
                <td className="px-2 py-1 text-center">{booking.peopleCount}</td>
                <td className="px-2 py-1 text-end">
                  {booking.unitPrice?.toFixed(2) || 0.0}
                </td>
                <td className="px-2 py-1 text-end">
                  {booking.finalPrice?.toFixed(2) || 0.0}
                </td>
                <td className="px-2 py-1 font-bold text-end">
                  {booking.finalPrice?.toFixed(2) || 0.0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-2 border-dashed" />

      {/* Summary */}
      <div className="text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>
            {currency} {subtotal?.toFixed(2) || 0.0}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax Total:</span>
          <span>
            {currency} {taxTotal?.toFixed(2) || 0.0}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Service Charge:</span>
          <span>
            {currency} {serviceCharge?.toFixed(2) || 0.0}
          </span>
        </div>
        <div className="flex justify-between mt-2 text-lg font-bold">
          <span>Total:</span>
          <span>
            {currency} {finalTotal?.toFixed(2) || 0.0}
          </span>
        </div>
      </div>

      <div className="border-b border-dashed mt-2"></div>

      {footer && (
        <div className="my-2">
          <p className="my-2 text-center">{footer}</p>
        </div>
      )}

      {/* Print-Specific Styling */}
      <style>
        {`
          @media print {
            body {
              background-color: white;
            }
            .print\\:bg-white {
              background-color: white !important;
            }
            .print\\:text-black {
              color: black !important;
            }
            .print\\:w-full {
              width: 100% !important;
            }
            hr {
              border-top: 1px dashed black;
            }
            table {
              width: 100%;
              table-layout: fixed;
            }
            td, th {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
          }
        `}
      </style>
    </div>
  );
}
