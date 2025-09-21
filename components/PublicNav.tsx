'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PublicNavProps {
  currentPage?: 'home' | 'about' | 'suppliers' | 'login';
}

export default function PublicNav({ currentPage = 'home' }: PublicNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/', key: 'home' },
    { name: 'About', href: '/about', key: 'about' },
    { name: 'Suppliers', href: '/suppliers-list', key: 'suppliers' },
    { name: 'Supplier Registration', href: '/suppliers', key: 'supplier-registration' },
    { name: 'Login', href: '/login', key: 'login' },
  ];

  return (
    <nav className="bg-header-yellow shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={40} 
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold text-gray-800 font-pacifico">
                
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentPage === item.key
                    ? 'text-gray-800 border-b-2 border-gray-800 font-semibold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
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
                      ? 'text-gray-800 bg-yellow-100 font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-yellow-50'
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
