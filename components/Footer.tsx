import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 font-pacifico">
              Technical University of Mombasa Procurement System
            </h3>
            <p className="text-gray-400">
              Comprehensive asset management and procurement solution for modern
              organizations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Asset Tracking</li>
              <li>Transfer Management</li>
              <li>Disposal Processing</li>
              <li>Report Generation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/suppliers-list" className="hover:text-white">
                  Suppliers Directory
                </Link>
              </li>
              <li>
                <Link href="/suppliers" className="hover:text-white">
                  Supplier Registration
                </Link>
              </li>
              <li>Contact</li>
              <li>Support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-twitter-line text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-linkedin-line text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="ri-facebook-line text-xl"></i>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; 2025 Technical University of Mombasa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
