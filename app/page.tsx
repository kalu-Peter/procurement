
'use client';

import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav currentPage="home" />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Smart Asset Management
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Streamline your procurement processes with our comprehensive asset management system
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </Link>
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
              Why Choose ProcureSystem?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage your organization's assets efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-computer-line text-blue-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Asset Tracking</h3>
              <p className="text-gray-600">
                Keep track of all your assets with detailed information, locations, and status updates in real-time.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-exchange-line text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Transfer Management</h3>
              <p className="text-gray-600">
                Streamline asset transfers between departments with automated approval workflows and tracking.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-bar-chart-line text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Reports</h3>
              <p className="text-gray-600">
                Generate comprehensive reports and analytics to make informed decisions about your assets.
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
              Join our network of trusted suppliers or browse our supplier directory
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-store-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Browse Suppliers</h3>
              <p className="text-gray-600 mb-6">
                Explore our comprehensive directory of verified suppliers across various categories and locations.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Become a Supplier</h3>
              <p className="text-gray-600 mb-6">
                Register your business with us and become part of our trusted supplier network.
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
            Ready to Transform Your Asset Management?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join organizations already using ProcurementSystem to streamline their operations
          </p>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 font-pacifico">ProcurementSystem</h3>
              <p className="text-gray-400">
                Comprehensive asset management and procurement solution for modern organizations.
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
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/suppliers-list" className="hover:text-white">Suppliers Directory</Link></li>
                <li><Link href="/suppliers" className="hover:text-white">Supplier Registration</Link></li>
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
            <p>&copy; 2025 ProcurementSystem. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
