/** @format */

import React from "react";
import { getDetailsForReceiptPrint } from "../helpers/ReceiptHelper";
import { getImageURL } from "../helpers/ImageHelper";
import { useTranslation } from "react-i18next";

export default function PrintReceiptPage() {
  const { t } = useTranslation();
  const receiptDetails = getDetailsForReceiptPrint();

  const {
    cartItems,
    deliveryType,
    customerType,
    customer,
    tableId,
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
    paidAmount,
    balance,
    invoiceId,
    cashierName,
  } = receiptDetails;
  const displayPayments = React.useMemo(() => {
    const raw = receiptDetails?.rawPayments || null;
    const meta = receiptDetails?.payments || [];
    if (!raw || Object.keys(raw).length === 0) return meta;
    return Object.entries(raw).map(([id, amount]) => {
      const found = meta.find((p) => String(p.id) === String(id));
      return {
        id: String(id),
        title: found?.title ?? `Payment ${id}`,
        amount: parseFloat(amount) || 0,
      };
    });
  }, [receiptDetails?.rawPayments, receiptDetails?.payments]);
  const {
    store_name,
    address,
    phone,
    email,
    store_image: storeImage,
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

  return (
    <div
      className={`w-[${page_format}mm] font-sans text-xs px-2 bg-white text-black`}
    >
      {show_store_details == 1 ? (
        <>
          {storeImage && (
            <img
              src={getImageURL(storeImage)}
              className="w-12 h-12 mx-auto filter grayscale mt-2 rounded-xl"
              alt="Store Image"
            />
          )}
          <p className="text-center mt-2">
            {store_name}
            <br />
            {address}
            <br />
            {t("print_receipt.phone")}: {phone}, {t("print_receipt.email")}:{" "}
            {email}
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

      {show_customer_details == 1 ? (
        <>
          <div className="border-b border-dashed"></div>
          <p className="text-center">
            {customerType}
            {customer && <span>, {customer?.name}</span>}
          </p>
          <p className="mt-1">
            {t("print_receipt.order_type")}: {deliveryType}
          </p>
        </>
      ) : (
        <></>
      )}

      {paymentMethod && (
        <>
          <div className="border-b border-dashed"></div>
          <p className="mt-1">
            {t("print_receipt.payment_method")}: {paymentMethod}
          </p>
        </>
      )}

      <div className="border-b border-dashed mt-2"></div>
      <div className="grid grid-cols-2">
        <p>
          {t("print_receipt.receipt_no")}: {tokenNo}-
          {new Date().toISOString().substring(0, 10)}
        </p>
        {invoiceId && (
          <p>
            Invoice ID :{" "}
            {Array.isArray(invoiceId)
              ? invoiceId.map((id) => String(id).padStart(5, "0")).join(", ")
              : String(invoiceId).padStart(5, "0")}
          </p>
        )}

        <p>{new Date().toLocaleString()}</p>
        {print_token == 1 && tokenNo ? (
          <div className=" bg-white">
            <p className="font-bold text-md">
              {t("print_receipt.token_no")} {tokenNo}
            </p>
          </div>
        ) : (
          <></>
        )}
      </div>

      {cashierName && (
        <div className="mt-1">
          <p>
            {t("print_receipt.cashier")}: {cashierName}
          </p>
        </div>
      )}

      <div className="border-b border-dashed mt-2"></div>
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
              <p className="text-[10px]">
                {t("print_receipt.addons")}:
                {addons_ids
                  .map((addonId, index) => {
                    const addon = addons.find((a) => a.id == addonId);
                    return addon.title;
                  })
                  ?.join(", ")}
              </p>
            )}
            {show_notes == 1 && notes ? (
              <p className="mb-2 text-[10px]">
                {t("print_receipt.notes")}: {notes}
              </p>
            ) : (
              <></>
            )}
            <div className="flex justify-between w-full">
              <p className="text-xs">
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
      <div className="border-b border-dashed mt-2"></div>

      <div className="flex justify-between">
        <p>{t("print_receipt.subtotal")}: </p>
        <p>
          {currency}
          {Number(itemsTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p>{t("print_receipt.tax")}: </p>
        <p>
          {currency}
          {Number(taxTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p>{t("print_receipt.service_charge")}: </p>
        <p>
          {currency}
          {Number(serviceChargeTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between text-lg font-bold">
        <p>{t("print_receipt.total")}: </p>
        <p>
          {currency}
          {Number(payableTotal).toFixed(2)}
        </p>
      </div>

      {/* Payment Information - Only show if paidAmount exists */}
      <div className="border-b border-dashed mt-2"></div>
      <p className="mt-1 font-bold">{t("pos.payment_details")}</p>

      {displayPayments && displayPayments.length > 0 ? (
        <>
          {/* individual lines */}
          {displayPayments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <p>{p.title}</p>
              <p>
                {currency}
                {p.amount.toFixed(2)}
              </p>
            </div>
          ))}

          {/* totals from raw amounts */}
          {(() => {
            const totalPaid = displayPayments.reduce(
              (sum, p) => sum + (parseFloat(p.amount) || 0),
              0
            );
            // Prefer the rawBalance you saved; otherwise compute from raw totals
            const balance =
              typeof receiptDetails.rawBalance === "number"
                ? receiptDetails.rawBalance
                : totalPaid - (receiptDetails.payableTotal || 0);

            return (
              <>
                <div className="flex justify-between mt-2">
                  <p>Total Paid:</p>
                  <p>
                    {currency}
                    {totalPaid.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between font-bold">
                  <p>Balance:</p>
                  <p className={balance}>
                    {currency}
                    {balance.toFixed(2)}
                  </p>
                </div>
              </>
            );
          })()}
        </>
      ) : (
        // Single-payment fallback (unchanged)
        <>
          {paymentMethod && (
            <p className="mt-1">
              {t("print_receipt.payment_method")}: {paymentMethod}
            </p>
          )}
          {paidAmount !== undefined && paidAmount !== null && (
            <>
              <div className="flex justify-between">
                <p>Amount Paid:</p>
                <p>
                  {currency}
                  {Number(paidAmount).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between font-bold">
                <p>Balance:</p>
                <p>
                  {currency}
                  {Math.abs(balance || 0).toFixed(2)}
                </p>
              </div>
            </>
          )}
        </>
      )}

      <div className="border-b border-dashed mt-2"></div>

      {footer && (
        <div className="my-2">
          <p className="my-2 text-center">{footer}</p>
        </div>
      )}
    </div>
  );
}
