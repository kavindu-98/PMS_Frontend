/** @format */

import React, { useRef, useState, useEffect } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPackages,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";

import toast from "react-hot-toast";
import { mutate } from "swr";
import { Link, useNavigate } from "react-router-dom";
import {
  addOption,
  deleteOption,
  useOptions,
  updateOption,
  useOptionCategories,
} from "../../controllers/settings.controller";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function otherOptionsSettingsPage() {
  const navigate = useNavigate();
  const packageNameRef = useRef();
  const packageTypeRef = useRef();
  const packagePriceRef = useRef();
  const descriptionRef = useRef();
  const packageNameUpdateRef = useRef();
  const packageTypeUpdateRef = useRef();
  const packagePriceUpdateRef = useRef();
  const descriptionUpdateRef = useRef();
  const [Description, setDescription] = useState("");
  const [packageId, setPackageId] = useState(null); // Use state for package id

  const { APIURL, data: options, error, isLoading } = useOptions();
  const {
    APIURL: APIURLCategories,
    data: categories,
    error: errorCategories,
    isLoading: isLoadingCategories,
  } = useOptionCategories();

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  if (isLoadingCategories) {
    return <Page>Please wait...</Page>;
  }

  if (errorCategories) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  async function btnAdd() {
    const packageName = packageNameRef.current.value;
    const packageType = packageTypeRef.current.value;
    const packagePrice = packagePriceRef.current.value;
    // const description = Description;
    const description = descriptionRef.current?.value;

    console.log("package name", packageName);
    console.log("packageType", packageType);

    if (!packageName) {
      toast.error("Please enter packageName!");
      return;
    }

    if (!packageType) {
      toast.error("Please provide Package Type!");
      return;
    }
    if (!packagePrice || packagePrice <= 0) {
      toast.error("Please provide a valid Package Price!");
      return;
    }
    if (!description) {
      toast.error("Please provide Description!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await addOption(
        packageName,
        packagePrice,
        packageType,
        description
      );

      if (res.status == 200 || res.status == 201) {
        packageTypeRef.current.value = null;
        packageNameRef.current.value = "";
        packagePriceRef.current.value = "";
        descriptionRef.current.value = "";
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error.response.data.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  const btnShowUpdate = async (
    id,
    package_name,
    package_price,
    category_name,
    description
  ) => {
    // Set the packageId in state
    setPackageId(id);

    // Update input fields
    if (packageNameUpdateRef.current)
      packageNameUpdateRef.current.value = package_name;
    if (packagePriceUpdateRef.current)
      packagePriceUpdateRef.current.value = package_price;

    if (descriptionUpdateRef.current)
      descriptionUpdateRef.current.value = description;

    // Find the category id based on the category_name
    const selectedCategory = categories.find(
      (category) => category.category_name === category_name
    );
    const categoryId = selectedCategory ? selectedCategory.id : "";

    // Set the correct category_id for the select value
    if (packageTypeUpdateRef.current)
      packageTypeUpdateRef.current.value = categoryId;

    const modal = document.getElementById("modal-update");
    if (modal) {
      modal.showModal(); // Show modal
    }
  };

  async function btnUpdate() {
    const id = packageId;
    console.log("Updating pcg with ID:", id); // Add this log
    const packageName = packageNameUpdateRef.current.value;
    const packageType = packageTypeUpdateRef.current.value;
    const packagePrice = packagePriceUpdateRef.current.value;
    const description = descriptionUpdateRef.current.value;

    if (!packageName) {
      toast.error("Please enter packageName!");
      return;
    }

    if (!packageType) {
      toast.error("Please provide Package Type!");
      return;
    }
    if (!packagePrice || packagePrice <= 0) {
      toast.error("Please provide a valid Package Price!");
      return;
    }
    if (!description) {
      toast.error("Please provide Description!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await updateOption(
        id,
        packageName,
        packagePrice,
        packageType,
        description
      );

      if (res.status == 200 || res.status == 201) {
        setPackageId(null);
        packageNameUpdateRef.current.value = null;
        packageTypeUpdateRef.current.value = null;
        packagePriceUpdateRef.current.value = null;
        descriptionUpdateRef.current.value = null;
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
        selectIngredientId("");
        document.getElementById("modal-update").close();
      }
    } catch (error) {
      const message = error.response.data.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteOption(id);

      if (res.status == 200) {
        await mutate(APIURL);
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

  return (
    <Page className="px-8 py-6">
      <div className="flex flex-col gap-2 md:items-center md:flex-row">
        <h3 className="mr-6 text-3xl font-light">Packages</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="flex items-center gap-1 px-2 py-1 mr-4 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg w-fit"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
        <Link
          to="categories"
          className="px-3 py-1 text-gray-500 transition border rounded-lg w-fit bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          Package Categories
        </Link>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {Array.isArray(options) && options?.length > 0 ? (
          options.map((option, index) => {
            const {
              id,
              package_name,
              package_price,
              category_name,
              description,
            } = option;

            return (
              <div
                key={id}
                className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm border rounded-2xl"
              >
                <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                  <IconPackages />
                </div>
                <div className="flex-1">
                  <p>{package_name}</p>
                  <p className="text-xs text-gray-400">{category_name}</p>
                  <div className="flex gap-7">
                    <p className="text-xs text-gray-400">
                      Package Price -{" "}
                      <span className="text-gray-600">{package_price}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-0">
                  <button
                    onClick={() => {
                      btnShowUpdate(
                        id,
                        package_name,
                        package_price,
                        category_name,
                        description
                      );
                    }}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                  >
                    <IconPencil stroke={iconStroke} />
                  </button>
                  <button
                    onClick={() => {
                      btnDelete(id);
                    }}
                    className="flex items-center justify-center w-8 h-8 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                  >
                    <IconTrash stroke={iconStroke} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">
            No Options available.
          </p>
        )}
      </div>

      {/* add dialog */}
      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Package</h3>

          <div className="mt-4">
            <label
              htmlFor="packageName"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Name
            </label>
            <input
              ref={packageNameRef}
              type="text"
              name="packageName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Package Name"
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="packageType"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Type
            </label>
            <select
              ref={packageTypeRef}
              name="packageType"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Product Unit"
            >
              <option value="">None</option>
              {categories?.map((category, index) => {
                return (
                  <option value={category.id} key={category.id}>
                    {category.category_name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="mt-4">
            <label
              htmlFor="packagePrice"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Price
            </label>
            <input
              ref={packagePriceRef}
              type="number"
              name="packagePrice"
              min={0}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Package Price"
            />
          </div>
          <div className="flex-1 mt-4">
            <label
              htmlFor="description"
              className="block mb-1 text-sm text-gray-500"
            >
              Description
            </label>

            <textarea
              ref={descriptionRef}
              name="notes"
              placeholder="Enter description here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                onClick={() => {
                  btnAdd();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* add dialog */}

      {/* Update dialog */}
      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Update Package</h3>

          <div className="mt-4">
            <label
              htmlFor="packageName"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Name
            </label>
            <input
              ref={packageNameUpdateRef}
              type="text"
              name="packageName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Package Name"
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="packageType"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Type
            </label>
            <select
              ref={packageTypeUpdateRef}
              name="packageType"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Package Type"
            >
              <option value="">None</option>
              {categories?.map((category, index) => {
                return (
                  <option value={category.id} key={category.id}>
                    {category.category_name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="mt-4">
            <label
              htmlFor="packagePrice"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Price
            </label>
            <input
              ref={packagePriceUpdateRef}
              type="number"
              name="packagePrice"
              min={0}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Package Price"
            />
          </div>
          <div className="flex-1 mt-4">
            <label
              htmlFor="description"
              className="block mb-1 text-sm text-gray-500"
            >
              Description
            </label>
            <textarea
              ref={descriptionUpdateRef}
              name="notes"
              placeholder="Enter description here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdate();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* Update dialog */}
    </Page>
  );
}
