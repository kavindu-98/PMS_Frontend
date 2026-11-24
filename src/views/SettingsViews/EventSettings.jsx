/** @format */
import React, { useRef, useState } from "react";
import Page from "../../components/Page";
import {
  IconConfetti,
  IconPencil,
  IconPlus,
  IconTrash,
  IconCirclePlus,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import { useCategories, useTaxes } from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { Link, useNavigate } from "react-router-dom";

import {
  addPackages,
  usePackageItems,
  deletePackage,
} from "../../controllers/dayOutPackages.controller";
import Select from "react-select"; // Import React Select

// Define options for activities and meals
const activityOptions = [
  { value: "Spa", label: "Spa" },
  { value: "Yoga", label: "Yoga" },
  { value: "Hiking", label: "Hiking" },
  { value: "Cooking Class", label: "Cooking Class" },
  { value: "Photography Workshop", label: "Photography Workshop" },
];

const mealOptions = [
  { value: "Breakfast", label: "Breakfast" },
  { value: "Lunch", label: "Lunch" },
  { value: "Snacks", label: "Snacks" },
  { value: "Dinner", label: "Dinner" },
  { value: "Buffet", label: "Buffet" },
];

function EventSettings() {
  const navigate = useNavigate();
  const nameRef = useRef();
  const pricePerPersonRef = useRef();
  const maxCapacityRef = useRef();
  const locationRef = useRef();
  const descriptionRef = useRef();
  const taxIdRef = useRef();
  const [selectedActivities, setSelectedActivities] = useState([]); // State for multi-select activities
  const [selectedMeals, setSelectedMeals] = useState([]); // State for multi-select meals

  const [imageFields, setImageFields] = useState([{}]);

  const {
    APIURL: APIURLTaxes,
    data: taxes,
    error: errorTaxes,
    isLoading: isLoadingTaxes,
  } = useTaxes();

  const { APIURL, data: packageItems, error, isLoading } = usePackageItems();

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }
  if (isLoadingTaxes) {
    return <p>Loading taxes...</p>;
  }

  if (errorTaxes) {
    return <p className="text-red-500">Error loading taxes</p>;
  }

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const newImageFields = [...imageFields];
    newImageFields[index] = {
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    };
    setImageFields(newImageFields);
  };

  const addImageField = () => {
    setImageFields([...imageFields, { url: null, name: "", file: null }]);
  };

  const removeImageField = (index) => {
    const newImageFields = imageFields.filter((_, i) => i !== index);
    setImageFields(newImageFields);
  };
  const btnAdd = async () => {
    const name = nameRef.current?.value || "";
    const pricePerPerson = pricePerPersonRef.current?.value || 0;
    const maxCapacity = maxCapacityRef.current?.value || 0;
    const location = locationRef.current?.value || "";
    const description = descriptionRef.current?.value || "";
    const taxId = taxIdRef.current.value || 0;

    // Convert selected values to arrays
    const activities = selectedActivities?.map((activity) => activity.value);
    const meals = selectedMeals?.map((meal) => meal.value);

    if (!name.trim() || !location.trim() || !description.trim()) {
      toast.error("Please fill all required fields!");
      return;
    }

    if (!pricePerPerson || pricePerPerson <= 0) {
      toast.error("Please provide a valid price per person!");
      return;
    }

    if (!maxCapacity || maxCapacity <= 0) {
      toast.error("Please provide a valid maximum capacity!");
      return;
    }

    if (imageFields.length === 0 || !imageFields.some((img) => img.file)) {
      toast.error("Please upload at least one image.");
      return;
    }

    try {
      toast.loading("Please wait...");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("pricePerPerson", pricePerPerson);
      formData.append("maxCapacity", maxCapacity);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("taxId", taxId);

      formData.append("activities", activities.join(","));
      formData.append("meals", meals.join(","));

      imageFields.forEach(({ file }) => {
        if (file) {
          formData.append("files", file);
        }
      });

      const res = await addPackages(formData);

      if (res.status === 200) {
        nameRef.current.value = "";
        setSelectedActivities([]);
        setSelectedMeals([]);
        pricePerPersonRef.current.value = "";
        maxCapacityRef.current.value = "";
        locationRef.current.value = "";
        descriptionRef.current.value = "";
        taxIdRef.current.value = 0;
        setImageFields([]);

        await mutate(APIURL);

        toast.dismiss();
        toast.success("Package added successfully!");
        document.getElementById("modal-add").close();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  };

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deletePackage(id);

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

  const btnClear = async () => {
    nameRef.current.value = "";
    setSelectedActivities([]);
    setSelectedMeals([]);
    pricePerPersonRef.current.value = "";
    maxCapacityRef.current.value = "";
    locationRef.current.value = "";
    descriptionRef.current.value = "";
    taxIdRef.current.value = 0;
    setImageFields([]);

    document.getElementById("modal-add").close();
  };

  const btnShowUpdate = (id) => {
    navigate(`/dashboard/settings/events/${id}`);
  };
  return (
    <Page className="px-8 py-6">
      <div className="flex flex-col gap-2 md:items-center md:flex-row">
        <h3 className="mr-6 text-3xl font-light">Day Out Packages</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="flex items-center gap-1 px-2 py-1 mr-4 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg w-fit"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {packageItems?.map((packageItems, index) => {
          const { id, name, price_per_person, location } = packageItems;

          return (
            <div
              key={id}
              className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm border rounded-2xl"
            >
              <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                <IconConfetti />
              </div>
              <div className="flex-1">
                <p>
                  {name} - {price_per_person}
                </p>
                <p className="text-xs text-gray-400">{location}</p>
              </div>
              <div className="flex gap-0">
                <button
                  onClick={() => {
                    btnShowUpdate(id);
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
        })}
      </div>

      {/* Add Dialog */}
      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Day Out Package</h3>

          <div className="mt-4">
            <label htmlFor="name" className="block mb-1 text-sm text-gray-500">
              Package Name
            </label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Package Name"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="activities"
              className="block mb-1 text-sm text-gray-500"
            >
              Activities
            </label>
            <Select
              isMulti
              options={activityOptions}
              value={selectedActivities}
              onChange={(selected) => setSelectedActivities(selected || [])}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Activities"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="meals" className="block mb-1 text-sm text-gray-500">
              Meals
            </label>
            <Select
              isMulti
              options={mealOptions}
              value={selectedMeals}
              onChange={(selected) => setSelectedMeals(selected || [])}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Meals"
            />
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="mt-4">
              <label
                htmlFor="location"
                className="block mb-1 text-sm text-gray-500"
              >
                Location
              </label>
              <input
                ref={locationRef}
                type="text"
                name="location"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Location"
              />
            </div>

            <div className="flex-1 my-4">
              <label
                htmlFor="capacity"
                className="block mb-1 text-sm text-gray-500"
              >
                Max Capacity
              </label>
              <input
                ref={maxCapacityRef}
                type="number"
                name="capacity"
                min={0}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Maximum Capacity"
                onInput={(e) => {
                  if (e.target.value < 0) e.target.value = 0;
                }}
              />
            </div>
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="">
              <label
                htmlFor="price"
                className="block mb-1 text-sm text-gray-500"
              >
                Price Per Person
              </label>
              <input
                ref={pricePerPersonRef}
                type="number"
                name="price"
                min={0}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price Per Person"
                onInput={(e) => {
                  if (e.target.value < 0) e.target.value = 0;
                }}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="tax" className="mb-1 block text-gray-500 text-sm">
                Tax
              </label>
              <select
                ref={taxIdRef}
                name="tax"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Tax"
              >
                <option value="">None</option>
                {taxes?.map((tax, index) => {
                  return (
                    <option value={tax.id} key={tax.id}>
                      {tax.title} - {tax.rate}% ({tax.type})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="description"
              className="block mb-1 text-sm text-gray-500"
            >
              Description
            </label>
            <input
              ref={descriptionRef}
              type="text"
              name="description"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Description"
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
              <button
                className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg"
                onClick={btnClear}
              >
                Close
              </button>
              <button
                type="button"
                onClick={btnAdd}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </Page>
  );
}

export default EventSettings;
