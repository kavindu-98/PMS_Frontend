/** @format */

import React, { useRef, useState } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconCirclePlus,
  IconBuilding,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  addHall,
  deleteHall,
  updateHall,
  useHalls,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";

export default function HallSettingsPage() {
  const hallNameRef = useRef();
  const minCountRef = useRef();
  const maxCountRef = useRef();
  const priceRef = useRef();
  const filesRef = useRef();
  const hallNameUpdateRef = useRef();
  const minCountUpdateRef = useRef();
  const maxCountUpdateRef = useRef();
  const priceUpdateRef = useRef();
  const filesUpdateRef = useRef();

  const [hallId, setHallId] = useState(null); // Use state for plateId
  const [imageFields, setImageFields] = useState([{}]);

  // const { APIURL, data: rooms, error, isLoading } = useRooms();
  const { APIURL, halls: halls, error, isLoading } = useHalls();

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteHall(id);

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

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const newImageFields = [...imageFields];
    newImageFields[index] = { url: null, name: file.name, file };
    setImageFields(newImageFields);
  };

  const addImageField = () => {
    setImageFields([...imageFields, { url: null, name: "", file: null }]);
  };

  const removeImageField = (index) => {
    const newImageFields = imageFields.filter((_, i) => i !== index);
    setImageFields(newImageFields);
  };
  async function btnAdd() {
    const hallName = hallNameRef.current.value;
    const minCount = minCountRef.current.value;
    const maxCount = maxCountRef.current.value;
    const price = priceRef.current.value;

    if (!hallName) {
      toast.error("Please provide Room No!");
      return;
    }
    if (!minCount) {
      toast.error("Please provide Min Count");
      return;
    }
    if (!maxCount) {
      toast.error("Please provide Max Count");
      return;
    }
    if (!price) {
      toast.error("Please provide Price");
      return;
    }

    if (imageFields.length === 0) {
      toast.error("Please add at least one image!");
      return;
    }

    const formData = new FormData();
    formData.append("hallName", hallName);
    formData.append("minCount", minCount);
    formData.append("maxCount", maxCount);
    formData.append("price", price);

    // Append each file to FormData
    imageFields.forEach(({ file }) => {
      if (file) {
        formData.append("files", file);
      }
    });

    try {
      toast.loading("Please wait...");
      const res = await addHall(formData); // Pass FormData to the API

      if (res.status === 200) {
        // Reset fields after successful submission
        hallNameRef.current.value = "";
        minCountRef.current.value = "";
        maxCountRef.current.value = "";
        priceRef.current.value = "";
        setImageFields([]); // Clear images
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);

        // Close modal after successful update
        const modal = document.getElementById("modal-add");
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
  }

  // Utility function to extract the file name from the URL
  const extractFileName = (url) => {
    const parts = url.split("/");
    const fileWithParams = parts[parts.length - 1]; // Get the last part of the URL
    const fileName = fileWithParams.split("?")[0]; // Remove any query parameters
    return fileName;
  };

  const btnShowUpdate = async (
    id,
    hallName,
    minCount,
    maxCount,
    price,
    images
  ) => {
    setHallId(id);

    // Populate fields with existing values
    hallNameUpdateRef.current.value = hallName;
    minCountUpdateRef.current.value = minCount;
    maxCountUpdateRef.current.value = maxCount;
    priceUpdateRef.current.value = price;

    // Handle existing image URLs
    const parsedImages = images?.map((url) => ({
      url,
      name: extractFileName(url),
      file: null,
    }));
    setImageFields(parsedImages);

    document.getElementById("modal-update").showModal();
  };

  const btnUpdate = async () => {
    const id = hallId;
    const hallName = hallNameUpdateRef.current.value;
    const minCount = minCountUpdateRef.current.value;
    const maxCount = maxCountUpdateRef.current.value;
    const price = priceUpdateRef.current.value;

    if (!hallName || !minCount || !maxCount || !price) {
      toast.error("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("hallName", hallName);
    formData.append("minCount", minCount);
    formData.append("maxCount", maxCount);
    formData.append("price", price);

    // Append only new images (files) to FormData
    imageFields.forEach((imageField) => {
      if (imageField.file) {
        formData.append("files", imageField.file);
      }
    });

    try {
      toast.loading("Updating hall...");
      const res = await updateHall(id, formData);

      if (res.status === 200) {
        setHallId(null);
        hallNameUpdateRef.current.value = "";
        minCountUpdateRef.current.value = "";
        maxCountUpdateRef.current.value = "";
        priceUpdateRef.current.value = "";
        setImageFields([]);

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
      toast.dismiss();
      toast.error(message);
    }
  };

  if (isLoading) {
    return <Page className="px-8 py-6">Please wait...</Page>;
  }

  if (error) {
    console.error(error);
    return <Page className="px-8 py-6">Error loading data, Try Later!</Page>;
  }

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Halls</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {Array.isArray(halls) && halls?.length > 0 ? (
          halls.map((hall, index) => {
            const { id, name, min_count, max_count, price, images } = hall;

            return (
              <div
                key={id}
                className="flex flex-col gap-4 px-4 py-3 text-sm border rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                    <IconBuilding />
                  </div>
                  <div>
                    <p>{name}</p>

                    <p className="text-gray-400">Hall Price: {price}</p>
                    <div className="flex gap-2">
                      <p className="text-xs text-gray-400">
                        Min Cap : {min_count}
                      </p>
                      <p className="text-xs text-gray-400">
                        Max Cap : {max_count}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0">
                    <button
                      onClick={() => {
                        btnShowUpdate(
                          id,
                          name,
                          min_count,
                          max_count,
                          price,
                          images
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
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">No Halls available.</p>
        )}
      </div>

      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Hall</h3>

          <div className="mt-4">
            <label
              htmlFor="hallName"
              className="block mb-1 text-sm text-gray-500"
            >
              Hall Name
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            <input
              ref={hallNameRef}
              type="text"
              name="hallName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Hall Name"
            />
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="minCount"
                className="block mb-1 text-sm text-gray-500"
              >
                Minimum Capacity
              </label>
              <input
                ref={minCountRef}
                type="number"
                min={0}
                name="minCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Min Capacity"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="maxCount"
                className="block mb-1 text-sm text-gray-500"
              >
                Maximum Capacity
              </label>
              <input
                ref={maxCountRef}
                type="number"
                min={0}
                name="maxCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Max Capacity"
              />
            </div>
          </div>
          <div className="flex-1">
            <label htmlFor="price" className="block mb-1 text-sm text-gray-500">
              Hall Price
            </label>
            <input
              ref={priceRef}
              type="number"
              min={0}
              name="price"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Hall Price"
            />
          </div>

          <div className="flex-1 mt-4">
            <label
              htmlFor="images"
              className="block mb-1 text-sm text-gray-500"
            >
              Add Images
            </label>
            {imageFields?.map((_, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                  onChange={(e) => handleImageChange(e, index)}
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="px-3 py-2 text-sm text-red-600 transition active:scale-95"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="flex items-center gap-2 px-4 py-2 mt-2 text-sm transition text-restro-green active:scale-95"
            >
              <IconCirclePlus className="w-4 h-4" />
              <span>Add More Images</span>
            </button>
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
      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Update Hall</h3>
          <div className="mt-4">
            <label
              htmlFor="hallName"
              className="block mb-1 text-sm text-gray-500"
            >
              Hall Name{" "}
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            <input
              ref={hallNameUpdateRef}
              type="text"
              name="hallName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Hall Name"
            />
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="minCount"
                className="block mb-1 text-sm text-gray-500"
              >
                Minimum Capacity
              </label>
              <input
                ref={minCountUpdateRef}
                type="number"
                min={0}
                name="minCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Minimum Capacity"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="maxCount"
                className="block mb-1 text-sm text-gray-500"
              >
                Maximum Capacity
              </label>
              <input
                ref={maxCountUpdateRef}
                type="number"
                min={0}
                name="maxCount"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Maximum Capacity"
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="price" className="block mb-1 text-sm text-gray-500">
              Hall Price
            </label>
            <input
              ref={priceUpdateRef}
              type="number"
              min={0}
              name="price"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Hall Price"
            />
          </div>

          <div className="flex-1 mt-4">
            <label
              htmlFor="images"
              className="block mb-1 text-sm text-gray-500"
            >
              Add Images
            </label>
            {imageFields?.map((imageField, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <div className="relative w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-2 text-sm border rounded-lg cursor-pointer bg-gray-50 outline-restro-border-green-light"
                    onChange={(e) => handleImageChange(e, index)}
                  />
                </div>
                {imageField.url && (
                  <p className="text-xs text-gray-500">{imageField.name}</p>
                )}
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="px-3 py-2 text-sm text-red-600 transition active:scale-95"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="flex items-center gap-2 px-4 py-2 mt-2 text-sm transition text-restro-green active:scale-95"
            >
              <IconCirclePlus className="w-4 h-4" />
              <span>Add More Images</span>
            </button>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                type="button"
                onClick={btnUpdate}
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
