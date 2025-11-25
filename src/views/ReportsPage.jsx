import React, { useRef, useState } from "react";
import Page from "../components/Page";
import { IconCarrot, IconDownload, IconFilter, IconSend } from "@tabler/icons-react";
import { iconStroke, API } from "../config/config";
import { useReports } from "../controllers/reports.controller";
import { CURRENCIES } from "../config/currencies.config";
import ReportPaymentTypePieChart from "../components/ReportPaymentTypePieChart";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import apiClient from "../helpers/ApiClient";

export default function ReportsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const filters = [
    { key: "today", value: t("reports.filters.today") },
    { key: "yesterday", value: t("reports.filters.yesterday") },
    { key: "last_7days", value: t("reports.filters.last_7days") },
    { key: "this_month", value: t("reports.filters.this_month") },
    { key: "last_month", value: t("reports.filters.last_month") },
    { key: "custom", value: t("reports.filters.custom") },
  ];

  const fromDateRef = useRef();
  const toDateRef = useRef();
  const filterTypeRef = useRef();
  const emailToRef = useRef();

  const now = new Date();
  const defaultDateFrom = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  // Default 'to' date should typically be the current date as well
  const defaultDateTo = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

  const [state, setState] = useState({
    filter: filters[0].key,
    fromDate: null,
    toDate: null,
  });

  // State to manage which parent category's items are currently expanded
  const [expandedParentCategoryId, setExpandedParentCategoryId] = useState(null);

  const { APIURL, data, error, isLoading } = useReports({
    type: state.filter,
    from: state.fromDate,
    to: state.toDate,
  });

  if (isLoading) {
    return <Page>{t("reports.loading_message")}</Page>;
  }

  if (error) {
    console.error(error);
    return <Page>{t("reports.error_message")}</Page>;
  }

  const {
    ordersCount,
    newCustomers,
    repeatedCustomers,
    currency: currencyCode,
    averageOrderValue,
    totalCustomers,
    netRevenue,
    taxTotal,
    serviceChargeTotal,
    topSellingItems,
    revenueTotal,
    totalPaymentsByPaymentTypes,
    salesByParentCategory,
  } = data;

  const currency = CURRENCIES.find((c) => c.cc == currencyCode)?.symbol;

  const btnExportCSV = async () => {
    try {
      const { Parser } = await import("@json2csv/plainjs");
      const { saveAs } = await import("file-saver");

      const summaryData = [
        {
          Orders: ordersCount ?? 0,
          "New Customers": newCustomers ?? 0,
          "Repeated Customers": repeatedCustomers ?? 0,
          "Avg. Order Value": Number(averageOrderValue ?? 0).toFixed(2),
          "Total Customers": totalCustomers ?? 0,
          "Net Revenue": Number(netRevenue ?? 0).toFixed(2),
          "Tax Total": Number(taxTotal ?? 0).toFixed(2),
          "Service Charge Total": Number(serviceChargeTotal ?? 0).toFixed(2),
          "Revenue Total": Number(revenueTotal ?? 0).toFixed(2),
        },
      ];

      // Top Selling Items
      const topSellingItemsData = (topSellingItems || []).map((item) => ({
        "Item Title": item.title || "",
        Category: item.category_title || "",
        "Parent Category": item.parent_category_title || "",
        "Item Price": Number(item.price ?? 0).toFixed(2),
        "Item Net Price": Number(item.net_price ?? 0).toFixed(2),
        "Orders Count": item.orders_count ?? 0,
      }));

      // Total Payments by Payment Type
      const totalPaymentsData = (totalPaymentsByPaymentTypes || []).map(
        (payment) => ({
          "Payment Type": payment.title || "",
          Total: Number(payment.total ?? 0).toFixed(2),
        })
      );

      // 🔹 Parent Category Sales
      const parentCategorySalesData = (salesByParentCategory || []).map(
        (category) => ({
          "Parent Category": category.parent_category_title || "",
          "Total Sales Value": Number(category.total_sales_value ?? 0).toFixed(
            2
          ),
          "Total Quantity": category.total_quantity ?? 0,
        })
      );

      // Create CSV parsers
      const parser1 = new Parser();
      const parser2 = new Parser();
      const parser3 = new Parser();
      const parser4 = new Parser();

      // Generate CSV for each section
      const summaryCsv = parser1.parse(summaryData);
      const topSellingItemsCsv =
        topSellingItemsData.length > 0
          ? parser2.parse(topSellingItemsData)
          : "";
      const totalPaymentsCsv =
        totalPaymentsData.length > 0 ? parser3.parse(totalPaymentsData) : "";
      const parentCategorySalesCsv =
        parentCategorySalesData.length > 0
          ? parser4.parse(parentCategorySalesData)
          : "";

      // Combine all CSV sections
      const csv = `
Reports,
${summaryCsv}
,
,
,
,
Top Selling Items,
${topSellingItemsCsv}
,
,
,
,
Total Payments by Types,
${totalPaymentsCsv}
,
,
,
,
Parent Category Sales,
${parentCategorySalesCsv}
`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const formattedDate = `${new Date().toISOString().substring(0, 10)}`;
      const fileName = `Reports Data - ${formattedDate}.csv`;

      saveAs(blob, fileName);
      // Removed toast.success
    } catch (error) {
      console.error("Error exporting CSV:", error);
      // Removed toast.dismiss and toast.error
    }
  };

  // Function to toggle the expanded state of a parent category
  const handleParentCategoryClick = (parentCategoryId) => {
    setExpandedParentCategoryId(
      expandedParentCategoryId === parentCategoryId ? null : parentCategoryId
    );
  };

  const btnSendEmail = () => {
    const dlg = document.getElementById("email-dialog");
    if (dlg && dlg.showModal) {
      dlg.showModal();
    }
  };

  const confirmSendEmail = () => {
    (async () => {
      try {
        const to = emailToRef?.current?.value?.trim();
        if (!to) {
          if (window?.toast?.error) {
            window.toast.error("Please enter recipient email");
          }
          return;
        }

        await apiClient.post(`/reports/send-email`, {
          recipient: to,
          type: state.filter,
          from: state.fromDate,
          to: state.toDate,
        });

        if (window?.toast?.success) {
          window.toast.success("Email request queued");
        }
        const dlg = document.getElementById("email-dialog");
        dlg?.close();
      } catch (e) {
        if (window?.toast?.error) {
          window.toast.error("Failed to queue email");
        }
        console.error(e);
      }
    })();
  };

  return (
    <Page>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl">{t("reports.title")}</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => document.getElementById("filter-dialog").showModal()}
            className="btn btn-sm rounded-full text-restro-text bg-restro-bg-gray border-none hover:bg-restro-button-hover"
          >
            <IconFilter stroke={iconStroke} /> {t("reports.filters_button")}
          </button>
          <button
            onClick={btnSendEmail}
            className="btn btn-sm rounded-full text-restro-text bg-restro-bg-gray hover:bg-restro-button-hover"
          >
            <IconSend stroke={iconStroke} /> Send Email
          </button>
          <button
            onClick={btnExportCSV}
            className="btn btn-sm rounded-full text-restro-text bg-restro-bg-gray hover:bg-restro-button-hover"
          >
            <IconDownload stroke={iconStroke} /> {t("reports.download_button")}
          </button>
        </div>
      </div>

      <h3 className="mt-6 mb-4 text-base">
        {t("reports.showing_data_for", {
          filter: filters.find((f) => f.key == state.filter).value,
        })}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* popular items */}
        <div className="row-span-3 rounded-3xl h-96 overflow-y-auto border border-restro-border-green">
          <div className="py-5 px-6 backdrop-blur rounded-t-3xl sticky top-0">
            <h3 className="font-bold">{t("reports.top_selling_items")}</h3>
          </div>

          {topSellingItems?.length === 0 && (
            <div className="w-full flex items-center justify-center flex-col px-8 2xl:px-10">
              <img
                src="/assets/illustrations/top-selling-not-found.webp"
                alt="no-top-selling items"
                className="w-7/12 mx-auto"
              />
              <p className="mt-4 text-center text-gray-500 font-semibold">
                {t("reports.no_bestsellers")}
              </p>
              <p className="text-center text-gray-500">
                {t("reports.no_bestsellers_message")}
              </p>
            </div>
          )}

          {topSellingItems?.length > 0 && (
            <div className="px-6 flex flex-col">
              {/* item */}
              {topSellingItems.map((item, i) => {
                return (
                  <div className="mb-4 flex items-center gap-2 w-full" key={i}>
                    <div className="w-12 h-12 flex items-center justify-center text-gray-500 dark:text-white rounded-lg bg-restro-bg-gray border border-restro-border-green">
                      <IconCarrot stroke={iconStroke} />
                    </div>

                    <div className="flex-1">
                      <p>{item?.title}</p>
                      <p className="text-xs text-gray-500">
                        {currency || ""}
                        {Number(item?.price).toFixed(2)}
                      </p>
                    </div>

                    <p className="font-bold">{item?.orders_count}</p>
                  </div>
                );
              })}
              {/* item */}
            </div>
          )}
        </div>
        {/* popular items */}

        {/* items sold */}
        <div className="rounded-3xl h-28 py-5 px-6 border border-restro-border-green">
          <h3 className="font-bold">{t("reports.orders")}</h3>
          <p className="mt-2 text-4xl">{ordersCount || 0}</p>
        </div>
        {/* items sold */}

        {/* avg. order value */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.avg_order_value")}</h3>
          <p className="mt-2 text-4xl">
            {currency}
            {Number(averageOrderValue).toFixed(2) || 0}
          </p>
        </div>
        {/* avg. order value */}

        {/* total customers */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.total_customers")}</h3>
          <p className="mt-2 text-4xl">{totalCustomers}</p>
        </div>
        {/* total customers */}

        {/* New customers */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.new_customers")}</h3>
          <p className="mt-2 text-4xl">{newCustomers}</p>
        </div>
        {/* New customers */}

        {/* repeat customers */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.repeat_customers")}</h3>
          <p className="mt-2 text-4xl">{repeatedCustomers}</p>
        </div>
        {/* repeat customers */}

        {/* revenue */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.revenue")}</h3>
          <p className="mt-2 text-4xl">
            {currency}
            {Number(revenueTotal).toFixed(2)}
          </p>
        </div>
        {/* revenue */}

        {/* payment total by payment types */}
        <div className="row-span-3 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.payments_by_methods")}</h3>
          <ReportPaymentTypePieChart
            paymentTypes={totalPaymentsByPaymentTypes}
          />
        </div>
        {/* payment total by payment types */}

        {/* net sales */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.net_sales")}</h3>
          <p className="mt-2 text-4xl">
            {currency}
            {Number(netRevenue).toFixed(2)}
          </p>
        </div>
        {/* net sales */}

        {/* tax */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.tax")}</h3>
          <p className="mt-2 text-4xl">
            {currency}
            {Number(taxTotal).toFixed(2)}
          </p>
        </div>
        {/* tax */}

        {/* Service Charge */}
        <div className="h-28 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.service_charge_total")}</h3>
          <p className="mt-2 text-4xl">
            {currency}
            {Number(serviceChargeTotal).toFixed(2)}
          </p>
        </div>
        {/* Service Charge */}

        {/* Parent Category Sales - MODIFIED */}
        <div className="row-span-3 py-5 px-6 rounded-3xl border border-restro-border-green">
          <h3 className="font-bold">{t("reports.sales_by_parent_category")}</h3>

          {(!data.salesByParentCategory ||
            data.salesByParentCategory.length === 0) && (
              <p className="mt-4 text-gray-500">
                {t("reports.no_parent_category_sales")}
              </p>
            )}
          {/* Parent Category Sale*/}
          {data.salesByParentCategory?.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {data.salesByParentCategory.map((cat, i) => (
                <div key={i} className="flex flex-col">
                  {/* Clickable Parent Category Header */}
                  <div
                    onClick={() => handleParentCategoryClick(cat.parent_category_id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-restro-border-green bg-restro-bg-gray cursor-pointer hover:bg-restro-button-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {/* Carrot Icon for expansion indication */}
                      {/* <IconCarrot
                        stroke={iconStroke}
                        className={`transition-transform duration-200 ${
                          expandedParentCategoryId === cat.parent_category_id
                            ? "rotate-90"
                            : ""
                        }`}
                      /> */}
                      <div>
                        <p className="font-semibold">{cat.parent_category_title}</p>
                        <p className="text-xs text-gray-500">
                          {t("pos.quantity")}: {cat.total_quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold">
                      {currency || ""}
                      {Number(cat.total_sales_value).toFixed(2)}
                    </p>
                  </div>

                  {/* Expanded Items for the Parent Category */}
                  {expandedParentCategoryId === cat.parent_category_id && (
                    <div className="mt-2 ml-4 border-l-2 border-restro-border-green pl-4">
                      {topSellingItems
                        ?.filter(
                          (item) =>
                            item.parent_category_id === cat.parent_category_id
                        )
                        .map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between py-2 border-b border-restro-border-green last:border-b-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-gray-500">
                                {currency || ""}
                                {Number(item.price).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              {/* Assuming 'reports.orders_count' exists in your translation files */}
                              {item.orders_count}
                            </p>
                          </div>
                        ))}
                      {topSellingItems?.filter(
                        (item) => item.parent_category_id === cat.parent_category_id
                      ).length === 0 && (
                          <p className="text-sm text-gray-500 italic py-2">
                            {/* Assuming 'reports.no_items_in_category' exists in your translation files */}
                            {t("reports.no_items_in_category")}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* End Parent Category Sales - MODIFIED */}
      </div>

      {/* filter dialog */}
      <dialog id="filter-dialog" className="modal">
        <div className="modal-box border border-restro-border-green dark:rounded-2xl">
          <h3 className="font-bold text-lg flex items-center">
            <IconFilter stroke={iconStroke} /> {t("reports.filter")}
          </h3>
          {/* filters */}
          <div className="my-4">
            <div>
              <label
                className={`mb-1 block text-gray-500 text-sm font-medium w-full`}
              >
                {t("reports.filter_label")}
              </label>
              <select
                className="select select-sm w-full rounded-lg border border-restro-border-green dark:bg-black focus:outline-restro-border-green"
                ref={filterTypeRef}
              >
                {filters.map((filter, index) => (
                  <option key={index} value={filter.key}>
                    {filter.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <div className="flex-1">
                <label
                  htmlFor="fromDate"
                  className=" block text-gray-500 text-sm"
                >
                  {t("reports.from")}
                </label>
                <input
                  defaultValue={defaultDateFrom}
                  type="date"
                  ref={fromDateRef}
                  className="text-sm w-full rounded-lg px-4 py-2 border border-restro-border-green dark:bg-black focus:outline-restro-border-green"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="toDate"
                  className=" block text-gray-500 text-sm"
                >
                  {t("reports.to")}
                </label>
                <input
                  defaultValue={defaultDateTo}
                  type="date"
                  ref={toDateRef}
                  className="text-sm w-full rounded-lg px-4 py-2 border border-restro-border-green dark:bg-black focus:outline-restro-border-green"
                />
              </div>
            </div>
          </div>
          {/* filters */}
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn transition active:scale-95 hover:shadow-lg px-4 py-3 flex-1 items-center justify-center align-center rounded-xl border border-restro-border-green bg-restro-card-bg hover:bg-restro-button-hover text-restro-text">
                {t("reports.close")}
              </button>
              <button
                onClick={() => {
                  setState({
                    ...state,
                    filter: filterTypeRef.current.value,
                    fromDate: fromDateRef.current.value || null,
                    toDate: toDateRef.current.value || null,
                  });
                }}
                className="btn rounded-xl transition active:scale-95 hover:shadow-lg px-4 py-3 text-white ml-3 border border-restro-border-green bg-restro-green hover:bg-restro-green-button-hover"
              >
                {t("reports.apply")}
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* filter dialog */}

      {/* email dialog */}
      <dialog id="email-dialog" className="modal">
        <div className="modal-box border border-restro-border-green dark:rounded-2xl">
          <h3 className="font-bold text-lg flex items-center">
            <IconSend stroke={iconStroke} /> Send Email
          </h3>
          <div className="my-4">
            <label className={`mb-1 block text-gray-500 text-sm font-medium w-full`}>
              Recipient Email
            </label>
            <input
              type="email"
              ref={emailToRef}
              placeholder="name@example.com"
              className="text-sm w-full rounded-lg px-4 py-2 border border-restro-border-green dark:bg-black focus:outline-restro-border-green"
            />
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn transition active:scale-95 hover:shadow-lg px-4 py-3 flex-1 items-center justify-center align-center rounded-xl border border-restro-border-green bg-restro-card-bg hover:bg-restro-button-hover text-restro-text">
                {t("reports.close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const dlg = document.getElementById("email-preview-dialog");
                  if (dlg && dlg.showModal) dlg.showModal();
                }}
                className="btn transition active:scale-95 hover:shadow-lg px-4 py-3 ml-3 items-center justify-center align-center rounded-xl border border-restro-border-green bg-restro-bg-gray hover:bg-restro-button-hover text-restro-text"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={confirmSendEmail}
                className="btn rounded-xl transition active:scale-95 hover:shadow-lg px-4 py-3 text-white ml-3 border border-restro-border-green bg-restro-green hover:bg-restro-green-button-hover"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* email dialog */}

      {/* email preview dialog */}
      <dialog id="email-preview-dialog" className="modal">
        <div className="modal-box w-11/12 max-w-4xl border border-restro-border-green dark:rounded-2xl">
          <h3 className="font-bold text-lg">{t("reports.preview_title") || "Report Preview"}</h3>
          <div className="my-4 overflow-y-auto max-h-[60vh]">
            <div>
              <p><strong>Filter:</strong> {filters.find((f) => f.key == state.filter)?.value}</p>
              {state.fromDate ? <p><strong>From:</strong> {state.fromDate}</p> : null}
              {state.toDate ? <p><strong>To:</strong> {state.toDate}</p> : null}
            </div>

            <hr className="my-3" />

            <div>
              <h4 className="font-semibold">Summary</h4>
              <ul className="list-inside list-disc">
                <li><strong>Orders:</strong> {ordersCount ?? 0}</li>
                <li><strong>New Customers:</strong> {newCustomers ?? 0}</li>
                <li><strong>Repeated Customers:</strong> {repeatedCustomers ?? 0}</li>
                <li><strong>Avg. Order Value:</strong> {currency}{Number(averageOrderValue ?? 0).toFixed(2)}</li>
                <li><strong>Total Customers:</strong> {totalCustomers ?? 0}</li>
                <li><strong>Net Revenue:</strong> {currency}{Number(netRevenue ?? 0).toFixed(2)}</li>
                <li><strong>Tax Total:</strong> {currency}{Number(taxTotal ?? 0).toFixed(2)}</li>
                <li><strong>Service Charge Total:</strong> {currency}{Number(serviceChargeTotal ?? 0).toFixed(2)}</li>
                <li><strong>Revenue Total:</strong> {currency}{Number(revenueTotal ?? 0).toFixed(2)}</li>
              </ul>
            </div>

            <hr className="my-3" />

            <div>
              <h4 className="font-semibold">Top Selling Items</h4>
              {topSellingItems?.length > 0 ? (
                <table className="table-auto w-full text-sm mt-2 border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Title</th>
                      <th className="border px-2 py-1">Category</th>
                      <th className="border px-2 py-1">Parent Category</th>
                      <th className="border px-2 py-1">Price</th>
                      <th className="border px-2 py-1">Net Price</th>
                      <th className="border px-2 py-1">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingItems.map((i, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{i.title || ""}</td>
                        <td className="border px-2 py-1">{i.category_title || ""}</td>
                        <td className="border px-2 py-1">{i.parent_category_title || ""}</td>
                        <td className="border px-2 py-1">{currency}{Number(i.price ?? 0).toFixed(2)}</td>
                        <td className="border px-2 py-1">{currency}{Number(i.net_price ?? 0).toFixed(2)}</td>
                        <td className="border px-2 py-1">{i.orders_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No bestsellers found.</p>
              )}
            </div>

            <hr className="my-3" />

            <div>
              <h4 className="font-semibold">Total Payments by Types</h4>
              {totalPaymentsByPaymentTypes?.length > 0 ? (
                <table className="table-auto w-full text-sm mt-2 border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Payment Type</th>
                      <th className="border px-2 py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalPaymentsByPaymentTypes.map((p, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{p.title || ""}</td>
                        <td className="border px-2 py-1">{currency}{Number(p.total ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No payment data.</p>
              )}
            </div>

            <hr className="my-3" />

            <div>
              <h4 className="font-semibold">Sales by Parent Category</h4>
              {salesByParentCategory?.length > 0 ? (
                <table className="table-auto w-full text-sm mt-2 border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Parent Category</th>
                      <th className="border px-2 py-1">Total Sales Value</th>
                      <th className="border px-2 py-1">Total Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByParentCategory.map((c, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{c.parent_category_title || ""}</td>
                        <td className="border px-2 py-1">{currency}{Number(c.total_sales_value ?? 0).toFixed(2)}</td>
                        <td className="border px-2 py-1">{c.total_quantity ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No parent category sales.</p>
              )}
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn transition active:scale-95 hover:shadow-lg px-4 py-3 flex-1 items-center justify-center align-center rounded-xl border border-restro-border-green bg-restro-card-bg hover:bg-restro-button-hover text-restro-text">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </Page>
  );
}