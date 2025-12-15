"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white bg-cover bg-center"
        style={{ backgroundImage: "url('/TUM1.jpg')" }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              University Smart Asset Management System
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Streamline TUM procurement processes with our comprehensive asset
              management system
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/about"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-xl text-gray-600">
              Empowering your the university with efficient asset management
              solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-computer-line text-blue-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Asset Tracking
              </h3>
              <p className="text-gray-600">
                Keep track of all your assets with detailed information,
                locations, and status updates in real-time.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-exchange-line text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Transfer Management
              </h3>
              <p className="text-gray-600">
                Streamline asset transfers between departments with automated
                approval workflows and tracking.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-bar-chart-line text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Advanced Reports
              </h3>
              <p className="text-gray-600">
                Generate comprehensive reports and analytics to make informed
                decisions about your assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Suppliers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Supplier Services
            </h2>
            <p className="text-xl text-gray-600">
              Join our network of trusted suppliers or browse our supplier
              directory
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-store-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Browse Suppliers
              </h3>
              <p className="text-gray-600 mb-6">
                Explore our comprehensive directory of verified suppliers across
                various categories and locations.
              </p>
              <Link
                href="/suppliers-list"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Supplier Directory
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-user-add-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Become a Supplier
              </h3>
              <p className="text-gray-600 mb-6">
                Register your business with us and become part of our trusted
                supplier network.
              </p>
              <Link
                href="/suppliers"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Register as Supplier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Streamling TUM Procurement Processes
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join the growing community of organizations using ProcurementSystem
            to enhance their procurement efficiency
          </p>
          <Link
            href="/suppliers"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
