/** @format */

import React, { useState, useEffect, useRef } from "react";
import Logo from "../assets/logo.png";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { SCOPES } from "../config/scopes";
import { signUp } from "../controllers/auth.controller";
import { validateEmail } from "../utils/emailValidator";
import { validatePhone } from "../utils/phoneValidator";
import axios from "axios";
export default function CustomerRegister() {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phone = e.target.phone.value;
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const gender = e.target.gender.value;
    const birthDate = e.target.birthDate.value;

    if (!validatePhone(phone)) {
      toast.error("Please provide Phone Number!");
      return;
    }

    if (!name) {
      toast.error("Please provide Name");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please provide valid Email!");
      return;
    }

    if (!password) {
      toast.error("Please provide password!");
      return;
    }
    if (!gender) {
      toast.error("Please select gender!");
      return;
    }

    if (!birthDate) {
      toast.error("Please provide BirthDate!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await signUp(phone, name, email, password, gender, birthDate);
      toast.dismiss();
      if (res.status == 200) {
        toast.success(res.data.message);
        navigate("/", {
          replace: true,
        });
        return;
      } else {
        const message = res.data.message;
        toast.dismiss();
        toast.error(message);
        return;
      }
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        "We're getting issues while processing the request, try later!";

      toast.dismiss();
      toast.error(message);
      return;
    }
  };

  // Fetch all emails from the backend to check existing Emails
  // useEffect(() => {
  //   const fetchEmails = async () => {
  //     try {
  //       const response = await axios.get("");
  //       const emailList = response.data.map((row) => row.email); // extract emails from all the rows in the table
  //       setEmails(emailList);
  //     } catch (err) {
  //       console.error("Error fetching emails:", err);
  //       setError("Failed to fetch email list");
  //     }
  //   };
  //   fetchEmails();
  // }, []);

  // Check if the new email exists in the list
  const checkEmail = () => {
    if (emails.includes(newEmail)) {
      setIsExisting(true);
    } else {
      setIsExisting(false);
    }
  };

  return (
    <div className="bg-restro-green-light relative overflow-x-hidden md:overflow-hidden">
      <img
        src="/assets/circle_illustration.svg"
        alt="illustration"
        className="absolute w-96 lg:w-[1024px] h-96 lg:h-[1024px]  lg:-bottom-96 lg:-right-52 -right-36 "
      />

      <div className="flex flex-col md:flex-row items-center justify-end md:justify-between gap-10 h-screen container mx-auto px-4 md:px-0 py-4 md:py-0 relative">
        <div className="lg:block hidden">
          <h3 className="text-2xl lg:text-6xl font-black text-restro-green-dark">
            Signup Today &
          </h3>
          <h3 className="text-2xl lg:text-6xl font-black text-restro-green-light outline-text">
            Increase Productivity
          </h3>
        </div>
        <div className="bg-white rounded-2xl px-8 py-8 w-full sm:w-96 mx-8 sm:mx-0 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-restro-green-dark text-xl font-medium">
              Register as a Customer
            </div>
            <div>
              <img src={Logo} className="h-16" />
            </div>
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            <div className="">
              <label className="block" htmlFor="name">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Enter Your Name here..."
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="Enter Your Email here..."
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}

                // onChange={(e) => setNewEmail(e.target.value)}
              />

              {error && <p className="text-red-500 mt-2">{error}</p>}
              {isExisting !== null && (
                <p className="mt-2">
                  {isExisting ? (
                    <span className="text-green-500">
                      Email already exists!
                    </span>
                  ) : (
                    <span className="text-blue-500">Email is unique!</span>
                  )}
                </p>
              )}

              {/* <button onClick={checkEmail}>Check Email</button>
            {isExisting !== null && (
                <p>{isExisting ? 'Email already exists!' : 'Email is unique!'}</p>
            )} */}
            </div>

            <div className="mt-4">
              <label className="block" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter Your Password here..."
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
              />
            </div>

            <div className="mt-4">
              <label className="block" htmlFor="gender">
                gender
              </label>
              <select
                id="gender"
                name="type"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Gender "
              >
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block" htmlFor="phone">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="Enter Your phone Number here"
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
              />
            </div>

            <div className="mt-4">
              <label className="block" htmlFor="birthDate">
                Birth Date
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                required
                placeholder="Select your Birth Date"
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="block w-full mt-6 bg-restro-green text-white rounded-xl px-4 py-3 transition hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-green-800/20"
            >
              Register
            </button>

            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 border-b"></div>
              <p className="text-sm text-gray-400">OR</p>
              <div className="flex-1 border-b"></div>
            </div>

            <Link
              to="/"
              className="block w-full text-center bg-slate-100 text-slate-500 rounded-xl px-4 py-3 transition hover:scale-105 active:scale-95 hover:shadow-xl hover:bg-slate-200 hover:shadow-slate-800/10"
            >
              Signin
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
