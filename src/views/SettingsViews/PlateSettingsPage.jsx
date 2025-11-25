/** @format */

import React, { useRef, useState, useEffect } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  addPlate,
  deletePlate,
  updatePlate,
  usePlates,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function PlateSettingsPage() {
  const packageNameRef = useRef();
  const pricePerPlateRef = useRef();
  const descriptionRef = useRef();
  const descriptionUpdateRef = useRef(null);
  const packageNameUpdateRef = useRef(null);
  const pricePerPlateUpdateRef = useRef(null);
  const plateIdRef = useRef(null);
  const [Description, setDescription] = useState("");
  const [plateId, setPlateId] = useState(null); // Use state for plateId

  const { APIURL, data: plates, error, isLoading } = usePlates();

  if (isLoading) {
    return <Page className="px-8 py-6">Please wait...</Page>;
  }

  if (error) {
    console.error(error);
    return <Page className="px-8 py-6">Error loading data, try later!</Page>;
  }

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure? This process is irreversible!"
    );
    if (!isConfirm) return;

    try {
      toast.loading("Please wait...");
      const res = await deletePlate(id);
      if (res.status === 200) {
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
  const btnAdd = async () => {
    const packageName = packageNameRef.current?.value?.trim();
    const pricePerPlate = pricePerPlateRef.current?.value;
    // const description = Description;
    const description = descriptionRef.current.value || null; // Get the content directly from Quill

    if (!packageName) {
      toast.error("Please provide Package Name!");
      return;
    }
    if (!pricePerPlate || pricePerPlate <= 0) {
      toast.error("Please provide a valid Plate Price!");
      return;
    }
    if (!description) {
      toast.error("Please provide Description!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addPlate(packageName, pricePerPlate, description);
      if (res.status === 200) {
        packageNameRef.current.value = "";
        pricePerPlateRef.current.value = "";
        descriptionRef.current.value = "";
        setDescription("");
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

  const btnShowUpdate = async (id, packageName, pricePerPlate, description) => {
    // Set the plateId in state
    setPlateId(id);
    console.log("Plate ID:", id); // Add this log to verify the id

    if (packageNameUpdateRef.current)
      packageNameUpdateRef.current.value = packageName;
    if (pricePerPlateUpdateRef.current)
      pricePerPlateUpdateRef.current.value = pricePerPlate;
    if (descriptionUpdateRef.current)
      descriptionUpdateRef.current.value = description;

    const modal = document.getElementById("modal-update");
    if (modal) {
      modal.showModal(); // Show modal
    }
  };

  const btnUpdate = async () => {
    const id = plateId; // Use the state value for plateId
    console.log("Updating plate with ID:", id); // Add this log

    const packageName = packageNameUpdateRef.current?.value;
    const pricePerPlate = pricePerPlateUpdateRef.current?.value;
    // const description = Description; // Use the current state value
    const description = descriptionUpdateRef.current.value || null;

    if (!packageName) {
      toast.error("Please provide Package Name!");
      return;
    }
    if (!pricePerPlate) {
      toast.error("Please provide Plate Price!");
      return;
    }
    if (!description) {
      toast.error("Please provide Description!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await updatePlate(
        id,
        packageName,
        pricePerPlate,
        description
      );
      if (res.status === 200) {
        setPlateId(null); // Clear plateId
        packageNameUpdateRef.current.value = null;
        pricePerPlateUpdateRef.current.value = null;
        descriptionUpdateRef.current.value = null;
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);

        // Close modal after successful update
        const modal = document.getElementById("modal-update");
        if (modal) {
          modal.close(); // Close modal
        }
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
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Plates</h3>
        <button
          onClick={() => {
            document.getElementById("modal-add").showModal();
            setDescription("");
          }}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      {/* List of Plates */}
      <div className="grid w-full grid-cols-1 gap-4 mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {Array.isArray(plates) && plates.length > 0 ? (
          plates.map((plate) => (
            <div
              key={plate.id}
              className="flex flex-col gap-4 px-4 py-3 text-sm border rounded-2xl"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                  <IconToolsKitchen2 />
                </div>
                <div>
                  <p>{plate.package_name}</p>
                  <p className="text-gray-400">
                    Price Per Plate: {plate.price_per_plate}
                  </p>
                </div>
                <div className="flex ml-4 gap-1">
                  <button
                    onClick={() =>
                      btnShowUpdate(
                        plate.id,
                        plate.package_name,
                        plate.price_per_plate,
                        plate.description
                      )
                    }
                    className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                  >
                    <IconPencil stroke={iconStroke} />
                  </button>
                  <button
                    onClick={() => btnDelete(plate.id)}
                    className="flex items-center justify-center w-8 h-8 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                  >
                    <IconTrash stroke={iconStroke} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No Plates available.</p>
        )}
      </div>

      {/* Add Modal */}
      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Plate Details</h3>
          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="packageName"
                className="block mb-1 text-sm text-gray-500"
              >
                {" "}
                Package Name
              </label>
              <input
                ref={packageNameRef}
                type="text"
                required
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Package Name"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="pricePerPlate"
                className="block mb-1 text-sm text-gray-500"
              >
                Price Per Plate
              </label>
              <input
                ref={pricePerPlateRef}
                type="number"
                required
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>
          </div>

          <div className="flex-1 mt-4">
            <label
              htmlFor="Description"
              className="block mb-1 text-sm text-gray-500"
            >
              Menu Description
            </label>
            <textarea
              ref={descriptionRef}
              name="notes"
              placeholder="Enter plate description here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>

              <button
                onClick={btnAdd}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Update Plate Details</h3>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="packageName"
                className="block mb-1 text-sm text-gray-500"
              >
                Package Name{" "}
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>
              <input
                ref={packageNameUpdateRef}
                type="text"
                min={0}
                name="packageName"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Package Name"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="pricePerPlate"
                className="block mb-1 text-sm text-gray-500"
              >
                Price Per Plate
              </label>
              <input
                ref={pricePerPlateUpdateRef}
                type="number"
                min={0}
                name="pricePerPlate"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>
          </div>

          <div className="flex-1 mt-4">
            <label
              htmlFor="Description"
              className="block mb-1 text-sm text-gray-500"
            >
              Menu Description
            </label>
            <textarea
              ref={descriptionUpdateRef}
              name="notes"
              placeholder="Enter plate description here..."
              className="block w-full h-24 px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
            ></textarea>
          </div>

          <div className="modal-action">
            <form method="dialog">
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
    </Page>
  );
}
