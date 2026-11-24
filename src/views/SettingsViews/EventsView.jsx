/** @format */

import React, { useRef, useState, useEffect } from "react";
import Page from "../../components/Page";
import { Link, useParams } from "react-router-dom";
import { IconCirclePlus } from "@tabler/icons-react";
import {
  updatePackages,
  usePackageItems,
  useDayOutPackageById,
} from "../../controllers/dayOutPackages.controller";
import { useCategories, useTaxes } from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { useNavigate } from "react-router-dom";
import Select from "react-select"; // Import React Select

export default function EventsView() {
  const params = useParams();
  const itemId = params.id;
  const navigate = useNavigate();
  const taxIdRef = useRef();
  const [selectedActivities, setSelectedActivities] = useState([]); // State for multi-select activities
  const [selectedMeals, setSelectedMeals] = useState([]); // State for multi-select meals
  const [imageFields, setImageFields] = useState([{}]);
  const [selectedTaxId, setSelectedTaxId] = useState("");
  const [formData, setFormData] = useState({
    itemId: "",
    name: "",
    price_per_person: "",
    max_capacity: "",
    location: "",
    activities: "",
    meals: "",
    description: "",
    files: "",
    taxId: "",
  });

  const {
    APIURL,
    data: packageItem,
    error,
    isLoading,
  } = useDayOutPackageById(itemId);

  const {
    APIURL: APIURLTaxes,
    data: taxes,
    error: errorTaxes,
    isLoading: isLoadingTaxes,
  } = useTaxes();

  console.log("id", itemId);
  console.log("package data", packageItem);

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

  // Populate form fields when packageItem is loaded
  useEffect(() => {
    if (packageItem) {
      console.log("Updating form with:", packageItem); // Debugging

      setFormData((prev) => ({
        ...prev,
        itemId: packageItem.id || "",
        name: packageItem.name || "",
        pricePerPerson: packageItem.price_per_person || "",
        maxCapacity: packageItem.max_capacity || "",
        location: packageItem.location || "",
        description: packageItem.description || "",
        taxId: packageItem.tax_id || "", //  Set tax ID
      }));

      // setSelectedTaxId(packageItem.tax_id || ""); //  Set default selected tax ID

      setSelectedActivities(
        packageItem.activities
          ? packageItem.activities.split(",").map((activity) => ({
              value: activity.trim(),
              label: activity.trim(),
            }))
          : []
      );

      setSelectedMeals(
        packageItem.meals
          ? packageItem.meals.split(",").map((meal) => ({
              value: meal.trim(),
              label: meal.trim(),
            }))
          : []
      );

      setImageFields(
        packageItem.imageUrls
          ? packageItem.imageUrls.map((url) => {
              const fileName = url.split("/").pop().split("?")[0];
              return {
                url,
                name: fileName,
                file: null,
              };
            })
          : []
      );
    }
  }, [packageItem]);

  // Handle input changes including tax selection
  const handleInputChangeTax = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      taxId: value, //  Ensure taxId is updated correctly
    }));
  };

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const newImageFields = [...imageFields];
    newImageFields[index] = { url: null, name: file.name, file };

    console.log("Updated images before state change:", newImageFields);

    setImageFields(newImageFields); // Update state

    console.log("State after update:", imageFields); // May not update immediately due to React state batching
  };

  const addImageField = () => {
    setImageFields((prevImages) => [
      ...prevImages,
      { url: null, name: "", file: null },
    ]);
  };

  const removeImageField = (index) => {
    setImageFields((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function btnSave() {
    console.log("btnSave triggered!");
    const {
      itemId,
      name,
      pricePerPerson,
      maxCapacity,
      location,
      description,
      taxId,
    } = formData;

    if (!name) {
      toast.error("Please enter a package name!");
      return;
    }
    if (pricePerPerson < 0) {
      toast.error("Please provide a valid price!");
      return;
    }

    try {
      toast.loading("Updating package...");

      const data = new FormData();
      data.append("id", itemId);
      data.append("name", name);
      data.append("pricePerPerson", Number(pricePerPerson));
      data.append("maxCapacity", Number(maxCapacity));
      data.append("location", location);
      data.append("description", description);
      data.append("taxId", taxId); //  Send selected tax ID

      const activitiesArray = selectedActivities.map(
        (activity) => activity.value
      );
      const mealsArray = selectedMeals?.map((meal) => meal.value);
      data.append("activities", activitiesArray.join(","));
      data.append("meals", mealsArray.join(","));

      imageFields.forEach((imageField) => {
        if (imageField.url && !imageField.file) {
          data.append("existingImages", imageField.url);
        }
      });

      imageFields.forEach((imageField) => {
        if (imageField.file) {
          data.append("files", imageField.file);
        }
      });

      console.log("Payload contents:", [...data.entries()]);

      const res = await updatePackages(itemId, data);

      if (res.status === 200) {
        await mutate(APIURL, { revalidate: true });
        toast.dismiss();
        toast.success(res.data.message || "Package updated successfully!");
        navigate("/dashboard/settings/events");
      } else {
        throw new Error(res.data?.message || "Update failed");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong!";
      console.error("Update error:", error);
      toast.dismiss();
      toast.error(message);
    }
  }

  return (
    <Page className="px-4 py-3 md:px-8 md:py-6">
      <div className="text-sm breadcrumbs">
        <ul>
          <li>
            <Link to="/dashboard/settings">Settings</Link>
          </li>
          <li>
            <Link to="/dashboard/settings/events">Day Out Package</Link>
          </li>
          <li>{formData.name}</li>
        </ul>
      </div>

      <div className="flex flex-col gap-6 my-6 lg:flex-row">
        <div className="flex-1">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm text-gray-500">
              Package Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Item Title"
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
            <div className="flex-1">
              <label
                htmlFor="location"
                className="block mb-1 text-sm text-gray-500"
              >
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Location"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="maxCapacity"
                className="block mb-1 text-sm text-gray-500"
              >
                Max Capacity
              </label>
              <input
                type="number"
                name="maxCapacity"
                value={formData.maxCapacity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Maximum Capacity"
              />
            </div>
          </div>
          <div className="flex w-full gap-4 my-4">
            {" "}
            <div className="flex-1">
              <label
                htmlFor="pricePerPerson"
                className="block mb-1 text-sm text-gray-500"
              >
                Price Per Person
              </label>
              <input
                type="number"
                name="pricePerPerson"
                value={formData.pricePerPerson}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price Per Person"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="tax" className="mb-1 block text-gray-500 text-sm">
                Tax
              </label>
              <select
                name="taxId"
                value={formData.taxId} //  Ensure value is set from state
                onChange={handleInputChangeTax} //  Ensure it updates state
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
              htmlFor="description"
              className="block mb-1 text-sm text-gray-500"
            >
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
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
                {imageField.url && (
                  <img
                    src={imageField.url}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="relative w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-2 text-sm border rounded-lg cursor-pointer bg-gray-50 outline-restro-border-green-light"
                    onChange={(e) => handleImageChange(e, index)}
                  />
                </div>
                <p className="text-xs text-gray-500">{imageField.name}</p>
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

          <button
            onClick={btnSave}
            className="w-full px-4 py-2 mt-6 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
          >
            Save
          </button>
        </div>
      </div>
    </Page>
  );
}
