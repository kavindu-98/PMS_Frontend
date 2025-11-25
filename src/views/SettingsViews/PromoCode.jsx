/** @format */

import { iconStroke } from "../../config/config";
import React, { useEffect, useRef, useState } from "react";
import Page from "../../components/Page";
import {
  IconAlertTriangleFilled,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import {
  usePromoCode,
  editPromoCode,
  addPromoCode,
  deletePromoCode,
} from "../../controllers/promoCode.controller";
import Papa from "papaparse";
import { mutate } from "swr";
import clsx from "clsx";

function PromoCode() {
  const [tableData, settableData] = useState([]);
  const [promoCodeTypes, setpromoCodeTypes] = useState([]);
  // const [selectedPromoType, setselectedPromoType] = useState([]);
  const [promoCodeList, setpromoCodeList] = useState([]);
  const [filterData, setFilterData] = useState({
    currentPage: 1,
  });
  const searchRef = useRef();
  const [selectedPromoType, setSelectedPromoType] = useState("corporate");
  const [error_1, setError] = useState("");
  const [promoEditId, setPromoEditId] = useState(null);

  // const { APIURL, data, error, isLoading } = usePromoCode() || {};

  const { APIURL, data, error, isLoading } = usePromoCode({
    page: filterData.currentPage,
  });
  console.log("view API  data => ", APIURL, data, error, isLoading);

  useEffect(() => {
    settableData(data?.data || []);
  }, [data]);

  const {
    page: currentPage = null,
    totalPages = null,
    totalItems = null,
  } = data?.pagination || {};

  const promoCodeTypes1 = [
    { id: "corporate", name: "Corporate Promo Code" },
    { id: "digital", name: "Digital Promo Code" },
  ];

  const promoCodeRef = useRef();
  const emailRef = useRef();
  const startDateRef = useRef();
  const endDateRef = useRef();
  const companyRef = useRef();
  const discountRef = useRef();

  const [isEditMode, setIsEditMode] = useState(false);

  const handlePromoTypeChange = (e) => {
    setSelectedPromoType(e.target.value);
    setError("");
  };

  const openEditModal = (data) => {
    console.log("data => ", data);
    if (data) {
      setPromoEditId(data.id);

      promoCodeRef.current.value = data.promo_code || "";
      emailRef.current.value = data.email || "";
      companyRef.current.value = data.company_name || "";
      discountRef.current.value = data.discount || "";
      searchRef.current.value = data.type || "";
      setSelectedPromoType(data.type || "");
      setIsEditMode(true); // Switch to Update mode

      // Format start and end dates to 'YYYY-MM-DD'
      if (data.start_date) {
        startDateRef.current.value = new Date(data.start_date)
          .toISOString()
          .split("T")[0];
      }
      if (data.end_date) {
        endDateRef.current.value = new Date(data.end_date)
          .toISOString()
          .split("T")[0];
      }
    }

    // Open the modal
    const modal = document.getElementById("modal-add");
    if (modal) {
      modal.showModal();
    }
  };

  const ExcelExport = () => {
    // Log the input to debug issues
    console.log("Exporting Data: ", tableData);

    // Validate the input data
    if (!Array.isArray(tableData) || tableData.length === 0) {
      alert("No data available for export.");
      return;
    }

    // Map table data to the desired CSV structure
    const csvData = tableData?.map((data) => ({
      "Promo Code": data.promo_code || "N/A",
      Discount: data.discount || "N/A",
      Type: data.type || "N/A",
      Email: data.email || "N/A", // Default to "N/A" if email is missing
      Status: data.status || "N/A",
    }));

    // Convert data to CSV format
    const csv = Papa.unparse(csvData);

    // Create and download the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "PromoCodes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function btnAdd() {
    const promoCodeData = {
      promo_code: promoCodeRef.current.value,
      type: selectedPromoType,
      company_name: companyRef.current.value,
      email: emailRef.current?.value,
      discount: discountRef.current.value,
      start_date: startDateRef.current.value,
      end_date: endDateRef.current.value,
    };

    // Validation checks
    if (!promoCodeData.type) {
      toast.error("Please select a promo code type!");
      return;
    }

    if (!promoCodeData.email && promoCodeData.type === "corporate") {
      toast.error("Please enter an email!");
      return;
    }

    if (!promoCodeData.promo_code) {
      toast.error("Please provide a promo code!");
      return;
    }

    if (!promoCodeData.start_date) {
      toast.error("Please provide a start date!");
      return;
    }

    if (!promoCodeData.end_date) {
      toast.error("Please provide an end date!");
      return;
    }

    try {
      toast.loading("Submitting promo code...");
      let res = null;
      if (promoEditId) {
        res = await editPromoCode({ id: promoEditId, ...promoCodeData });
      } else {
        res = await addPromoCode(promoCodeData);
      }

      if ([200, 201].includes(res.status)) {
        // Reset all fields
        resetModalFields();

        if (APIURL) {
          await mutate(APIURL);
        }

        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-add").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  async function btnUpdate() {
    const payload = {
      promo_code: promoCodeRef.current.value,
      email: emailRef.current.value,
      start_date: startDateRef.current.value,
      end_date: endDateRef.current.value,
      company_name: companyRef.current.value,
      discount: discountRef.current.value,
      type: searchRef.current.value,
    };

    try {
      toast.loading("Please Wait...");
      let res = null;
      if (promoEditId) {
        res = await editPromoCode({ id: promoEditId, ...payload });
      }

      if ([200, 201].includes(res.status)) {
        // Reset all fields
        resetModalFields();

        if (APIURL) {
          await mutate(APIURL);
        }

        setIsEditMode(false);
        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-add").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  const btnDelete = async (id) => {
    try {
      toast.loading("Deleting promo code...");
      const res = await deletePromoCode({ id });
      if (res.status === 200) {
        if (APIURL) {
          await mutate(APIURL);
        }
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  };

  const resetModalFields = () => {
    setPromoEditId(null);
    promoCodeRef.current.value = "";
    emailRef.current.value = "";
    startDateRef.current.value = "";
    endDateRef.current.value = "";
    companyRef.current.value = "";
    discountRef.current.value = "";
    searchRef.current.value = "";
  };

  // pagination
  const btnPaginationFirstPage = () => {
    setFilterData((ps) => ({ ...ps, currentPage: 1 }));
  };
  const btnPaginationLastPage = () => {
    setFilterData((ps) => ({ ...ps, currentPage: totalPages }));
  };
  const btnPaginationNextPage = () => {
    if (currentPage == totalPages) {
      return;
    }
    setFilterData((ps) => ({ ...ps, currentPage: currentPage + 1 }));
  };
  const btnPaginationPreviousPage = () => {
    if (currentPage == 1) {
      return;
    }
    setFilterData((ps) => ({ ...ps, currentPage: currentPage - 1 }));
  };
  // pagination

  return (
    <div>
      <div>
        <Page className="px-8 py-6">
          <div className="flex justify-between">
            <h3 className="text-3xl font-light">Add Promo Code </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => document.getElementById("modal-add").showModal()}
                className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
              >
                <IconPlus size={22} stroke={iconStroke} /> New
              </button>
              <button
                onClick={ExcelExport}
                className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
              >
                📄 Export CSV
              </button>
            </div>
          </div>

          <div className="mt-8 w-full">
            <table className="w-full border overflow-x-auto">
              <thead>
                <tr>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Promo Code
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Company Name
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-28">
                    Email
                  </th>

                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Type
                  </th>

                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-20">
                    Discount %
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-20">
                    Status
                  </th>

                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData?.map((data, index) => {
                  // const { id, title, rate, type } = data;

                  return (
                    <tr key={index}>
                      <td className="px-3 py-2 text-start">
                        {data.promo_code}
                      </td>
                      <td className="px-3 py-2 text-start">
                        {data.company_name}
                      </td>
                      <td className="px-3 py-2 text-start">{data.email}</td>
                      <td className="px-3 py-2 text-start">{data.type}</td>
                      <td className="px-3 py-2 text-start">{data.discount}</td>
                      <td className="px-3 py-2 text-start">{data.status}</td>

                      <td className="px-3 py-2 text-start flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => openEditModal(data)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
                        >
                          <IconPencil stroke={iconStroke} />
                        </button>
                        <button
                          onClick={() => {
                            setPromoEditId(data.id);
                            document.getElementById("modal-delete").showModal();
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-gray-100 transition active:scale-95"
                        >
                          <IconTrash stroke={iconStroke} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex justify-end mt-8">
            <div className="join">
              <button
                onClick={btnPaginationFirstPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == 1,
                  }
                )}
              >
                <IconChevronsLeft stroke={iconStroke} />
              </button>
              <button
                onClick={btnPaginationPreviousPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == 1,
                  }
                )}
              >
                <IconChevronLeft stroke={iconStroke} />
              </button>
              <button className="join-item btn btn-sm bg-gray-100 text-gray-500">
                Page {currentPage}
              </button>
              <button
                onClick={btnPaginationNextPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == totalPages,
                  }
                )}
              >
                <IconChevronRight stroke={iconStroke} />
              </button>
              <button
                onClick={btnPaginationLastPage}
                className={clsx(
                  "join-item btn btn-sm bg-gray-100 text-gray-500",
                  {
                    "btn-disabled": currentPage == totalPages,
                  }
                )}
              >
                <IconChevronsRight stroke={iconStroke} />
              </button>
            </div>
          </div>
          <div className="text-end mt-4">
            <p>
              Showing {tableData?.length} of {totalItems}
            </p>
          </div>
          {/* pagination */}

          <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box">
              <h3 className="font-bold text-lg">{`${
                promoEditId ? "Edit" : "Add"
              } New Promo Code`}</h3>

              <div className="mt-4">
                <label
                  htmlFor="promoCodeType"
                  className="mb-1 block text-gray-500 text-sm"
                >
                  Select Promo Code Type:
                </label>
                <select
                  ref={searchRef}
                  onChange={handlePromoTypeChange}
                  className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                  placeholder="Select Promo Code type"
                >
                  {promoCodeTypes1?.map((option, index) => (
                    <option key={index} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="item_name"
                  className="mb-1 block text-gray-500 text-sm"
                >
                  Promo Code
                </label>
                <input
                  ref={promoCodeRef}
                  type="text"
                  name="promoCode"
                  className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                  placeholder="Enter Promo Code"
                />
              </div>

              <div className="mt-4">
                <div
                  className="flex-1"
                  style={{
                    display:
                      selectedPromoType === "corporate" ? "block" : "none",
                  }}
                >
                  <label
                    htmlFor="email"
                    className="mb-1 block text-gray-500 text-sm"
                  >
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                    placeholder="Enter Email"
                  />
                </div>

                <div className="flex gap-4 w-full my-4">
                  <div className="flex-1">
                    <label
                      htmlFor="startDate"
                      className="mb-1 block text-gray-500 text-sm"
                    >
                      {" "}
                      Start Date
                    </label>
                    <input
                      ref={startDateRef}
                      type="date"
                      name="startDate"
                      className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      placeholder="Enter Start Date"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="endDate"
                      className="mb-1 block text-gray-500 text-sm"
                    >
                      {" "}
                      End Date
                    </label>
                    <input
                      ref={endDateRef}
                      type="date"
                      name="endDate"
                      className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      placeholder="Enter End Date"
                    />
                  </div>
                </div>

                <div className="flex gap-4 w-full my-4">
                  <div className="flex-1">
                    <label
                      htmlFor="company"
                      className="mb-1 block text-gray-500 text-sm"
                    >
                      {" "}
                      Company
                    </label>
                    <input
                      ref={companyRef}
                      type="text"
                      name="company"
                      className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      placeholder="Enter Company Name"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="discount"
                      className="mb-1 block text-gray-500 text-sm"
                    >
                      Discount
                    </label>
                    <input
                      ref={discountRef}
                      type="number"
                      name="discount"
                      min="0"
                      className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                      placeholder="Enter discount amount"
                      onInput={(e) => {
                        // Prevent values less than 0
                        if (e.target.value < 0) {
                          e.target.value = 0;
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="modal-action">
                  <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button
                      onClick={() => resetModalFields()}
                      className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        if (isEditMode) {
                          btnUpdate();
                        } else {
                          btnAdd();
                        }
                      }}
                      className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
                    >
                      {isEditMode ? "Update" : "Submit"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </dialog>

          <dialog
            id="modal-delete"
            className="modal fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Overlay */}
            {/* <div className="absolute inset-0 bg-red-600 opacity-30"></div> */}

            {/* Modal Box */}
            <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-auto z-10">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Are you sure you want to delete this promocode?
                </h2>
              </div>

              <div className="mt-4 text-center">
                <div className="mt-2 p-4 bg-red-100 rounded-lg text-left">
                  <div className="flex items-center">
                    <IconAlertTriangleFilled
                      className="text-red-600 mr-2"
                      size={24}
                    />
                    <p className="text-red-700 font-bold text-lg">Warning</p>
                  </div>
                  <p className="text-red-700 mt-1 text-sm">
                    This Item in the promo code will be{" "}
                    <b>permanently deleted</b>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={() => {
                    document.getElementById("modal-delete").close();
                    setPromoEditId(null);
                  }}
                  className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-6 py-3 bg-gray-200 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    btnDelete(promoEditId);
                    setPromoEditId(null);
                    document.getElementById("modal-delete").close();
                  }}
                  className="rounded-lg hover:bg-red-500 transition active:scale-95 hover:shadow-lg px-6 py-3 bg-red-700 text-white"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </dialog>
        </Page>
      </div>
    </div>
  );
}

export default PromoCode;
