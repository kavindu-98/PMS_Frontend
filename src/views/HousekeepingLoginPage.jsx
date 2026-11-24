/** @format */

import React, { useEffect } from "react";
import Logo from "../assets/logo.png";
import { toast } from "react-hot-toast";
import { HousekeeperSignIn } from "../controllers/auth.controller";
import { Link, useNavigate } from "react-router-dom";
import { isRestroUserAuthenticated } from "../helpers/AuthStatus";
import {
  getUserDetailsInLocalStorage,
  saveUserDetailsInLocalStorage,
} from "../helpers/UserDetails";
import { SCOPES } from "../config/scopes";

export default function HousekeepingLoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const restroAuthenticated = isRestroUserAuthenticated();
    if (restroAuthenticated) {
      const { role, scope } = getUserDetailsInLocalStorage() || {};
      if (role == "superadmin") {
        navigate("/superadmin/dashboard/home", {
          replace: true,
        });
        return;
      }

      const userScopes = scope.split(",");
      if (userScopes.includes(SCOPES.HOUSEKEEPING)) {
        navigate("/dashboard/housekeeping-services", {
          replace: true,
        });
        return;
      } else {
        navigate("/dashboard/profile", {
          replace: true,
        });
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    if (!username) {
      e.target.username.focus();
      toast.error("Please provide username!");
      return;
    }

    if (!password) {
      e.target.password.focus();
      toast.error("Please provide password!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await HousekeeperSignIn(username, password);

      if (res.status == 200) {
        toast.dismiss();
        toast.success(res.data.message);

        const user = res.data.user;
        saveUserDetailsInLocalStorage(user);

        const { scope } = getUserDetailsInLocalStorage();
        console.log("hi lohin");
        const userScopes = scope.split(",");
        if (userScopes.includes(SCOPES.HOUSEKEEPING)) {
          navigate("/dashboard/housekeeping-services", {
            replace: true,
          });
          return;
        } else {
          navigate("/dashboard/profile", {
            replace: true,
          });
        }

        return;
      } else {
        const message = res.data.message;
        toast.dismiss();
        toast.error(message);
        return;
      }
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || "Something went wrong!";

      toast.dismiss();
      toast.error(message);
      return;
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
        <div>
          <h3 className="text-2xl lg:text-6xl font-black text-restro-green-dark">
            Cafe. Restaurant.
          </h3>
          <h3 className="text-2xl lg:text-6xl font-black text-restro-green-light outline-text">
            Hotel. Bar.
          </h3>
        </div>
        <div className="bg-white rounded-2xl px-8 py-8 w-full sm:w-96 mx-8 sm:mx-0 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-restro-green-dark text-xl font-medium">
              Login as Housekeeper
            </div>
            <div>
              <img src={Logo} className="h-16" />
            </div>
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            <div>
              <label className="block" htmlFor="username">
                Email
              </label>
              <input
                type="email"
                id="username"
                name="username"
                required
                placeholder="Enter Your email here..."
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
              />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block" htmlFor="password">
                  Password
                </label>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter Your Password here..."
                className="mt-1 block w-full bg-gray-100 px-4 py-3 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="block w-full mt-6 bg-restro-green text-white rounded-xl px-4 py-3 transition hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-green-800/20"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
