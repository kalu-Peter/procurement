"use client";

import { useState } from "react";
import Link from "next/link";

interface PublicNavProps {
  currentPage?: "home" | "about" | "login" | "supplier-registration";
}

export default function PublicNav({ currentPage = "home" }: PublicNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const navItems = [
    { name: "Home", href: "/", key: "home" },
    { name: "About", href: "/about", key: "about" },
    {
      name: "Supplier Registration",
      href: "/suppliers",
      key: "supplier-registration",
    },
    { name: "Login", href: "/login", key: "login" },
  ];

  return (
    <nav className="bg-header-yellow shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-gray-800 font-pacifico">
                TUM Procurement
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.key === "supplier-registration") {
                return (
                  <div key={item.key} className="relative">
                    <button
                      onClick={() =>
                        setShowSupplierDropdown(!showSupplierDropdown)
                      }
                      className={`px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1 ${
                        currentPage === item.key
                          ? "text-gray-800 border-b-2 border-gray-800 font-semibold"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <span>{item.name}</span>
                      <i
                        className={`ri-arrow-down-s-line transition-transform ${
                          showSupplierDropdown ? "rotate-180" : ""
                        }`}
                      ></i>
                    </button>

                    {showSupplierDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <Link
                          href="/suppliers"
                          className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={() => setShowSupplierDropdown(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <i className="ri-user-add-line text-green-600"></i>
                            <div>
                              <div className="font-medium">
                                Register as Supplier
                              </div>
                              <div className="text-sm text-gray-500">
                                Join our supplier network
                              </div>
                            </div>
                          </div>
                        </Link>
                        <Link
                          href="/suppliers-list"
                          className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={() => setShowSupplierDropdown(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <i className="ri-store-line text-blue-600"></i>
                            <div>
                              <div className="font-medium">
                                Browse Suppliers
                              </div>
                              <div className="text-sm text-gray-500">
                                View supplier directory
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    currentPage === item.key
                      ? "text-gray-800 border-b-2 border-gray-800 font-semibold"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <i
                className={`ri-${isMenuOpen ? "close" : "menu"}-line text-xl`}
              ></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-300">
            <div className="py-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium transition-colors ${
                    currentPage === item.key
                      ? "text-gray-800 bg-yellow-100 font-semibold"
                      : "text-gray-700 hover:text-gray-900 hover:bg-yellow-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
