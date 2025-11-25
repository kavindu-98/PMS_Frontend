import React, { useRef , useEffect } from "react";
import { toast } from "react-hot-toast";
import { addCustomer } from "../controllers/customer.register.controller";
import { mutate } from "swr";
import { signIn } from "../controllers/auth.controller";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail } from "../utils/emailValidator";
import { validatePhone } from "../utils/phoneValidator";

export default function AdminRegister({APIURL, defaultValue, onSuccess}) {
  const phoneRef = useRef();
  const nameRef = useRef();
  const emailRef = useRef();
  const genderRef = useRef();
  const birthDateRef = useRef();

  useEffect(()=>{
    if(/^\d+$/.test(defaultValue)) {
      // it's number
      phoneRef.current.value = defaultValue;
    } else {
      nameRef.current.value = defaultValue;
    }
  }, [defaultValue])

  async function btnAdd() {
    const phone = phoneRef.current.value;
    const name = nameRef.current.value;
    const email = emailRef.current.value || null;
    const gender = genderRef.current.value || null;
    const birthDate = birthDateRef.current.value || null;

    if(!phone) {
      toast.error("Please Provide Phone Number!");
      return;
    }

    if(!name) {
      toast.error("Please Provide Your Name!");
      return;
    }

    if(email) {
      if(!validateEmail(email)) {
        toast.error("Please Provide Valid Email!");
        return;
      }
    }
    if(!validatePhone(phone)) {
      toast.error("Please provide valid phone no.!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addCustomer(phone, name, email, birthDate, gender);

      if(res.status == 200) {
        phoneRef.current.value = null;
        nameRef.current.value = null;
        emailRef.current.value = null;
        genderRef.current.value = null;
        birthDateRef.current.value = null;

        if(APIURL){
          await mutate(APIURL);
        }
        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-add-customer").close();
        onSuccess(phone, name);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  return (
    <dialog
      id="modal-add-customer"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">Create New Admin</h3>

        <div className="mt-4">
          <label htmlFor="phone" className="mb-1 block text-gray-500 text-sm">
            Phone <span className="text-xs text-gray-400">- (Required)</span>
          </label>
          <input
            ref={phoneRef}
            type="tel"
            name="phone"
            className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            placeholder="Enter Customer's Phone No."
          />
        </div>

        <div className="mt-4">
          <label htmlFor="name" className="mb-1 block text-gray-500 text-sm">
            Name <span className="text-xs text-gray-400">- (Required)</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            name="name"
            className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            placeholder="Enter Customer's Name"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="email" className="mb-1 block text-gray-500 text-sm">
            Email
          </label>
          <input
            ref={emailRef}
            type="email"
            name="email"
            className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            placeholder="Enter Customer's Email"
          />
        </div>

        <div className="flex gap-4 w-full my-4">
          <div className="flex-1">
            <label htmlFor="birthdate" className="mb-1 block text-gray-500 text-sm">
              Birth Date
            </label>
            <input
              ref={birthDateRef}
              type="date"
              name="birthdate"
              max={new Date().toISOString().substring(0, 10)}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Birth Date"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="type" className="mb-1 block text-gray-500 text-sm">
              Gender
            </label>
            <select
              ref={genderRef}
              name="type"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Tax Type"
            >
              <option value="">
                Select Gender
              </option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="modal-action">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
              Close
            </button>
          </form>
          <button
            onClick={() => {
              btnAdd();
            }}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
}


