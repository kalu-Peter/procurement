'use client';

import PublicNav from '@/components/PublicNav';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav currentPage="about" />
      
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About ProcureSystem
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing asset management with cutting-edge technology and innovative solutions
              that help organizations streamline their procurement processes.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 text-lg mb-6">
                To empower organizations with comprehensive asset management solutions that increase 
                efficiency, reduce costs, and provide complete visibility into their procurement processes.
              </p>
              <p className="text-gray-600 text-lg">
                We believe that effective asset management is the cornerstone of operational excellence, 
                and we're committed to making it accessible to organizations of all sizes.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600">Organizations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1M+</div>
                  <div className="text-gray-600">Assets Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Organizations Choose Us</h2>
            <p className="text-xl text-gray-600">
              Comprehensive features designed for modern asset management needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-shield-check-line text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with 99.9% uptime guarantee and regular backups.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-user-settings-line text-green-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">User-Friendly</h3>
              <p className="text-gray-600">
                Intuitive interface designed for users of all technical levels with comprehensive training.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-line-chart-line text-purple-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Scalable Solution</h3>
              <p className="text-gray-600">
                Grows with your organization from small teams to enterprise-level deployments.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-smartphone-line text-yellow-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Ready</h3>
              <p className="text-gray-600">
                Access your asset data anywhere with our responsive design and mobile apps.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-tools-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Integration</h3>
              <p className="text-gray-600">
                Seamlessly integrate with your existing systems through our robust API platform.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-customer-service-line text-indigo-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Support</h3>
              <p className="text-gray-600">
                24/7 customer support with dedicated account managers for enterprise clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">
              Experienced professionals dedicated to your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="ri-user-line text-gray-500 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sarah Johnson</h3>
              <p className="text-blue-600 mb-3">CEO & Founder</p>
              <p className="text-gray-600 text-sm">
                15+ years in enterprise software development and asset management solutions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="ri-user-line text-gray-500 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Michael Chen</h3>
              <p className="text-blue-600 mb-3">CTO</p>
              <p className="text-gray-600 text-sm">
                Technology leader with expertise in scalable systems and security architecture.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="ri-user-line text-gray-500 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Emily Rodriguez</h3>
              <p className="text-blue-600 mb-3">Head of Customer Success</p>
              <p className="text-gray-600 text-sm">
                Passionate about delivering exceptional customer experiences and driving adoption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the organizations that trust ProcureSystem for their asset management needs
          </p>
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
