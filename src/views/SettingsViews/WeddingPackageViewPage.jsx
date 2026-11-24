/** @format */

import React, { useRef, useState, useEffect } from "react";
import Page from "../../components/Page";
import { Link, useParams } from "react-router-dom";

import {
  useCategories,
  usePlates,
  useTaxes,
  useWeddingPackages,
  useHalls,
  useWeddingPackage,
  useOptions,
  useOptionCategories,
  updateWeddingPackage,
  uploadFlyerImage,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";

import {
  IconConfetti,
  IconChevronDown,
  IconPencil,
  IconTrash,
  IconUpload,
  IconCirclePlus,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import imageCompression from "browser-image-compression";
import { getImageURL } from "../../helpers/ImageHelper";

export default function WeddingPackageViewPage() {
  const params = useParams();
  const pkgId = params.id;

  const packageNameRef = useRef();
  const hallIdRef = useRef();
  const plateDetailsRef = useRef();
  const pricePerPersonRef = useRef();
  const taxIdRef = useRef();

  const {
    APIURL,
    pkgs: packagesData,
    error,
    isLoading,
  } = useWeddingPackage(pkgId);

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
    data: optionsData = [],
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

  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedHall, setSelectedHall] = useState("");
  const [compressedImage, setCompressedImage] = useState(null);
  const [selectedTax, setSelectedTax] = useState("");

  const packageDetails = packagesData?.[0] || {};

  const {
    wedding_package_id,
    wedding_package_name,
    Hall_id,
    hall_name,
    flyer_image_path,
    plate_package_name,
    price_per_person,
    options = [],
    flyer_image_url,
    tax: { tax_id } = {}, // Safely extract tax_id from the nested tax object
  } = packageDetails;

  console.log("packagesData", packageDetails);

  useEffect(() => {
    if (plates.length > 0 && plate_package_name) {
      const matchingPlate = plates.find(
        (plate) => plate.package_name === plate_package_name
      );
      if (matchingPlate) {
        setSelectedPlate(matchingPlate.id); // Set plate ID instead of name
      }
    }

    if (halls.length > 0 && hall_name) {
      const matchingHall = halls.find((hall) => hall.name === hall_name);
      if (matchingHall) {
        setSelectedHall(matchingHall.id); // Set hall ID instead of name
      }
    }

    if (tax_id) {
      setSelectedTax(tax_id);
    }
  }, [plates, halls, plate_package_name, hall_name, tax_id]);

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

  useEffect(() => {
    if (options.length > 0) {
      const initialFieldGroups = options?.map((option) => {
        const filtered = options.filter(
          (opt) => opt.category_id === option.category_id
        );
        return {
          category: Number(option.category_id), // Ensure category is a number
          option: option.package_id,
          filteredOptions: filtered,
        };
      });

      setFieldGroups(initialFieldGroups);
    }
  }, [options]);

  const handleFieldChange = (index, fieldName, value) => {
    const updatedGroups = [...fieldGroups];

    if (fieldName === "category") {
      const selectedCategoryId = Number(value);
      const filtered = optionsData.filter(
        (option) => option.category_id === selectedCategoryId
      );

      updatedGroups[index] = {
        category: selectedCategoryId,
        option: filtered.length > 0 ? filtered[0].package_id : "", // Auto-select first option
        filteredOptions: filtered,
      };
    } else {
      updatedGroups[index][fieldName] = value;
    }

    setFieldGroups(updatedGroups);
  };

  async function btnSave() {
    const packageName = packageNameRef.current.value;
    const hallId = hallIdRef.current.value;
    const plateDetails = plateDetailsRef.current.value || null;
    const pricePerPerson = pricePerPersonRef.current.value || null;
    const taxId = taxIdRef.current.value || null;

    // Ensure fieldGroups data is valid
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

    const otherAmmenities = fieldGroups?.map((group) => ({
      categoryId: parseInt(group.category, 10),
      packageId: parseInt(group.option, 10),
    }));

    // Basic Validations
    if (!packageName) {
      toast.error("Please enter Package Name!");
      return;
    }
    if (!hallId) {
      toast.error("Please select a hall!");
      return;
    }
    if (pricePerPerson < 0) {
      toast.error("Please provide a valid price!");
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append("packageName", packageName);
    formData.append("hallId", hallId);
    formData.append("plateDetails", plateDetails);
    formData.append("pricePerPerson", pricePerPerson);
    formData.append("otherAmmenities", JSON.stringify(otherAmmenities));
    formData.append("taxId", taxId);

    try {
      toast.loading("Please wait...");
      const res = await updateWeddingPackage(wedding_package_id, formData);

      if (res.status === 200) {
        // Reset form fields correctly
        // packageNameRef.current.value = "";
        // plateDetailsRef.current.value = "";
        // pricePerPersonRef.current.value = "";
        // hallIdRef.current.value = "";
        // setFieldGroups([]); // Ensure it's reset to an empty array, not a string

        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // compress image
    try {
      toast.loading("Please wait...");
      const compressedImage = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("files", compressedImage);

      const res = await uploadFlyerImage(wedding_package_id, formData);
      if (res.status == 200) {
        toast.dismiss();
        toast.success(res.data.message);

        // update the image state
        // const imagePath = res.data.imageURL;
        await mutate(APIURL);
        location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      const message =
        error?.response?.data?.message ||
        "We're getting issue while processing your request, Please try later!";
      toast.error(message);
    }
  };

  return (
    <Page className="px-4 py-3 md:px-8 md:py-6">
      <div className="text-sm breadcrumbs">
        <ul>
          <li>
            <Link to="/dashboard/settings">Settings</Link>
          </li>

          <li>
            <Link to="/dashboard/settings/wedding-packages">
              Wedding Package
            </Link>
          </li>
          <li>{wedding_package_name}</li>
        </ul>
      </div>

      <div className="flex flex-col gap-6 my-6 lg:flex-row">
        <div className="">
          <div className="relative flex items-center justify-center w-32 h-32 mb-4 text-2xl text-gray-600 bg-gray-200 md:w-64 md:h-64 rounded-2xl">
            {flyer_image_url ? (
              <div className="relative top-0 left-0 w-full h-full">
                <img
                  src={flyer_image_url}
                  alt={flyer_image_path}
                  className="absolute top-0 left-0 object-cover w-full h-full rounded-2xl"
                />
              </div>
            ) : (
              <p className="absolute">
                <IconConfetti stroke={iconStroke} />
              </p>
            )}

            {/* upload image options */}
            <div className="absolute flex items-center gap-2 bottom-2 md:bottom-auto md:top-4 md:right-4">
              <label
                htmlFor="file"
                className="flex items-center justify-center transition bg-white rounded-full shadow cursor-pointer w-9 h-9 hover:bg-slate-100 active:scale-95"
              >
                <IconUpload stroke={iconStroke} size={18} />
                <input
                  onChange={handleFileChange}
                  type="file"
                  name="file"
                  id="file"
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <button
            onClick={btnSave}
            className="w-full px-4 py-2 mt-6 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
          >
            Save
          </button>
        </div>
        <div className="flex-1">
          <div className="">
            <label
              htmlFor="packageName"
              className="block mb-1 text-sm text-gray-500"
            >
              Package Name
            </label>
            <input
              ref={packageNameRef}
              defaultValue={wedding_package_name}
              type="text"
              name="packageName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Package Name"
            />
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="hallId"
                className="block mb-1 text-sm text-gray-500"
              >
                Hall
              </label>
              <select
                ref={hallIdRef}
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
                name="hallId"
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
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
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
                defaultValue={price_per_person}
                type="number"
                name="pricePerPerson"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price Per Person"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="taxId"
                className="mb-1 block text-gray-500 text-sm"
              >
                Tax
              </label>
              <select
                ref={taxIdRef}
                name="taxId"
                value={selectedTax}
                onChange={(e) => setSelectedTax(e.target.value)}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              >
                <option value="">None</option>
                {taxes?.map((tax) => (
                  <option key={tax.id} value={tax.id}>
                    {tax.title} - {tax.rate}% ({tax.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="other-options"
              className="block mb-1 text-sm text-gray-500"
            >
              Other Options
            </label>

            {fieldGroups?.map((group, index) => (
              <div key={index} className="flex w-full gap-4 mb-4">
                {/* Category Dropdown */}
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
                    {categories?.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Option Dropdown */}
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
                    {group?.filteredOptions?.map((option) => (
                      <option value={option.package_id} key={option.package_id}>
                        {option.package_name}
                      </option>
                    ))}
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
            ))}

            <button
              type="button"
              onClick={handleAddFieldGroup}
              className="flex items-center gap-2 px-4 py-2 mt-2 text-sm transition text-restro-green active:scale-95"
            >
              <IconCirclePlus className="w-4 h-4" />
              <span>Add More Options</span>
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
