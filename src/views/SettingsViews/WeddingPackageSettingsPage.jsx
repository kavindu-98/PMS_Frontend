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
import {
  useOptionCategories,
  useHalls,
  useOptions,
  usePlates,
  useWeddingPackages,
  addWeddingPackage,
  deleteWeddingPackage,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { Link, useNavigate } from "react-router-dom";
import { useCategories, useTaxes } from "../../controllers/settings.controller";

export default function WeddingPackageSettingsPage() {
  const navigate = useNavigate();
  const packageNameRef = useRef();
  const hallIdRef = useRef();
  const plateDetailsRef = useRef();
  const pricePerPersonRef = useRef();
  const taxIdRef = useRef();
  const { APIURL, pkgs: pkgs, error, isLoading } = useWeddingPackages();
  const {
    APIURL: APIURLHalls,
    halls: halls,
    error: errorHalls,
    isLoading: isLoadingHalls,
  } = useHalls();

  const {
    APIURL: APIURLPlates,
    data: plates = [],
    error: errorPlates,
    isLoading: isLoadingPlates,
  } = usePlates();
  const {
    APIURL: APIURLOptions,
    data: options = [],
    error: errorOptions,
    isLoading: isLoadingOptions,
  } = useOptions();
  const {
    APIURL: APIURLCategories,
    data: categories = [],
    error: errorCategories,
    isLoading: isLoadingCategories,
  } = useOptionCategories();

  const {
    APIURL: APIURLTaxes,
    data: taxes,
    error: errorTaxes,
    isLoading: isLoadingTaxes,
  } = useTaxes();

  const [fieldGroups, setFieldGroups] = useState([
    { category: "", option: "", filteredOptions: [] },
  ]);

  const handleAddFieldGroup = () => {
    setFieldGroups([
      ...fieldGroups,
      { category: "", option: "", filteredOptions: [] },
    ]);
  };

  const handleRemoveFieldGroup = (index) => {
    setFieldGroups(fieldGroups.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, fieldName, value) => {
    const updatedGroups = [...fieldGroups];
    updatedGroups[index][fieldName] = value;

    // Filter options based on category ID
    if (fieldName === "category") {
      const selectedCategoryId = parseInt(value, 10); // Convert the category ID to a number for comparison
      const filtered = options.filter(
        (option) => option.category_id === selectedCategoryId // Ensure proper type comparison
      );
      updatedGroups[index].filteredOptions = filtered; // Update filtered options for the specific group
      updatedGroups[index].option = ""; // Reset the option value when category changes
    }

    setFieldGroups(updatedGroups);
  };
  if (isLoadingTaxes) {
    return <p>Loading taxes...</p>;
  }

  if (errorTaxes) {
    return <p className="text-red-500">Error loading taxes</p>;
  }
  //  console.log(categories);
  async function btnAdd() {
    const packageName = packageNameRef.current.value;
    const hallId = hallIdRef.current.value || null;
    const plateDetails = plateDetailsRef.current.value;
    const pricePerPerson = pricePerPersonRef.current.value || null;
    const taxId = taxIdRef.current.value || null;

    // Collecting Other Amenities
    const otherAmmenities = fieldGroups?.map((group) => ({
      categoryId: parseInt(group.category, 10), // Ensure category ID is a number
      packageId: parseInt(group.option, 10), // Ensure package ID is a number
    }));

    // Validation for fieldGroups
    for (const group of fieldGroups) {
      if (!group.category) {
        toast.error("Please select a category for all amenities!");
        return;
      }
      if (!group.option) {
        toast.error("Please select an option for all amenities!");
        return;
      }
    }

    // File input for the flyer image
    const flyerImageInput = document.querySelector('input[type="file"]');
    const file = flyerImageInput?.files[0]; // Get the selected file

    // Validation
    if (!packageName) {
      toast.error("Please enter Package Name!");
      return;
    }

    if (!hallId) {
      toast.error("Please select hall!");
      return;
    }

    if (pricePerPerson < 0) {
      toast.error("Please provide valid price!");
      return;
    }

    if (!file) {
      toast.error("Please upload an image!");
      return;
    }

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append("packageName", packageName);
    formData.append("hallId", hallId);
    formData.append("plateDetails", plateDetails);
    formData.append("pricePerPerson", pricePerPerson);
    formData.append("otherAmmenities", JSON.stringify(otherAmmenities)); // Adding other amenities as JSON string
    formData.append("files", file); // Attach the image file
    formData.append("taxId", taxId);

    try {
      toast.loading("Please wait...");
      const res = await addWeddingPackage(formData);

      if (res.status == 200) {
        // Clear fields after successful submission
        packageNameRef.current.value = null;
        plateDetailsRef.current.value = null;
        pricePerPersonRef.current.value = null;
        hallIdRef.current.value = null;
        taxIdRef.current.value = null;
        setFieldGroups("");

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

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteWeddingPackage(id);

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

  const btnShowUpdate = (id) => {
    navigate(`/dashboard/settings/wedding-packages/${id}`);
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex flex-col gap-2 md:items-center md:flex-row">
        <h3 className="mr-6 text-3xl font-light">Wedding Packages</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="flex items-center gap-1 px-2 py-1 mr-4 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg w-fit"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {pkgs?.map((pkg, index) => {
          const {
            wedding_package_id,
            wedding_package_name,
            flyer_image_path,
            plate_package_name,
            options,
            flyer_image_url,
            price_per_person,
          } = pkg;

          return (
            <div
              key={wedding_package_id}
              className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm border rounded-2xl"
            >
              <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                <IconConfetti />
              </div>
              <div className="flex-1">
                <p>{wedding_package_name}</p>
                <p className="text-xs text-gray-400">{plate_package_name}</p>
                <p className="text-xs text-gray-400">
                  Price Per Person : {price_per_person}.00
                </p>
              </div>
              <div className="flex gap-0">
                <button
                  onClick={() => {
                    btnShowUpdate(wedding_package_id);
                  }}
                  className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                >
                  <IconPencil stroke={iconStroke} />
                </button>
                <button
                  onClick={() => {
                    btnDelete(wedding_package_id);
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

      {/* add dialog */}
      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Wedding Package</h3>

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

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="hall"
                className="block mb-1 text-sm text-gray-500"
              >
                Hall
              </label>
              <select
                ref={hallIdRef}
                name="hall"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Hall"
              >
                <option value="">None</option>
                {halls?.map((hall) => (
                  <option value={hall.id} key={hall.id}>
                    {hall.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="plateDetails"
                className="block mb-1 text-sm text-gray-500"
              >
                Plate Details
              </label>
              <select
                ref={plateDetailsRef}
                name="plateDetails"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Plate Details"
              >
                <option value="">None</option>
                {plates?.length > 0 ? (
                  plates.map((plate) => (
                    <option value={plate.id} key={plate.id}>
                      {plate.package_name}
                    </option>
                  ))
                ) : (
                  <option value="">Loading plates...</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="pricePerPerson"
                className="block mb-1 text-sm text-gray-500"
              >
                Price Per Person
              </label>
              <input
                ref={pricePerPersonRef}
                type="number"
                name="pricePerPerson"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price Per Person"
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

          <div className="flex-1 mt-4">
            <label
              htmlFor="images"
              className="block mb-1 text-sm text-gray-500"
            >
              Add Flyer Image
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="file"
                accept="image/*"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="other-options"
              className="block mb-1 text-sm text-gray-500"
            >
              Other Options
            </label>
            {(Array.isArray(fieldGroups) ? fieldGroups : [])?.map(
              (group, index) => (
                <div key={index} className="flex w-full gap-4 mb-4">
                  <div className="flex-1">
                    <select
                      name="category"
                      value={group.category}
                      onChange={(e) =>
                        handleFieldChange(index, "category", e.target.value)
                      }
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    >
                      <option value="">Category Type</option>
                      {categories && categories?.length > 0 ? (
                        categories.map((category) => (
                          <option value={category.id} key={category.id}>
                            {category.category_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No categories available</option>
                      )}
                    </select>
                  </div>

                  <div className="flex-1">
                    <select
                      name="option"
                      value={group.option}
                      onChange={(e) =>
                        handleFieldChange(index, "option", e.target.value)
                      }
                      className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                    >
                      <option value="">Option</option>
                      {group.filteredOptions?.length > 0 ? (
                        group.filteredOptions.map((option) => (
                          <option value={option.id} key={option.id}>
                            {option.package_name}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          No options available for this category
                        </option>
                      )}
                    </select>
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFieldGroup(index)}
                      className="px-3 py-2 text-sm text-red-600 transition active:scale-95"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )
            )}

            <button
              type="button"
              onClick={handleAddFieldGroup}
              className="flex items-center gap-2 px-4 py-2 mt-2 text-sm transition text-restro-green active:scale-95"
            >
              <IconCirclePlus className="w-4 h-4" />
              <span>Add More Options</span>
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
      {/* add dialog */}
    </Page>
  );
}
