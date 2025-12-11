"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/auth";
import PublicNav from "@/components/PublicNav";
import Header from "@/components/Header";

const counties = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita-Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka-Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang'a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo-Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi",
];

const supplyCategories = [
  "TUM/REG/01/2025/2027 - Supply and Delivery of General Office Stationery",
  "TUM/REG/30/2025/2027 - Provision of Consultancy Services Such as In-House Training And Capacity Building, ISO, Governance Audit, Asset tagging",
  "TUM/REG/27/2025/2027 - Repair and Maintenance of ICT equipment and Photocopier Machines",
  "TUM/REG/22/2025/2027 - Supply, delivery, installation and servicing & maintenance air conditioners, cold Room Equipment & other refrigeration items",
  "TUM/REG/17/2025/2027 - Supply and delivery of sportswear, equipment and related services",
  "TUM/REG/12/2025/2027 - Supply and Delivery of Laboratory Chemicals and Reagents and Laboratory equipment",
  "TUM/REG/07/2025/2027 - Supply and Delivery of Motor Vehicle Spare Parts, Batteries Tires and Tubes, Oil and Lubricants and allied products",
  "TUM/REG/02/2025/2027 - Supply and Delivery of Computer Accessories, Tonners and Cartridges",
  "TUM/REG/28/2025/2027 - Provision of Event Organizing Services, Hiring of Tents, Chairs, tables, decorating materials and Sound System.",
  "TUM/REG/23/2025/2027 - Supply, Delivery, Servicing and Maintenance of Fire Fighting Equipment and fire alarms",
  "TUM/REG/18/2025/2027 - Supply and Delivery of Stainless-steel Catering Equipment& Related Kitchen Wares, Cutlery and Crockery",
  "TUM/REG/13/2025/2027 - Supply and Delivery of Textbooks, Periodicals, Magazines and other reading materials",
  "TUM/REG/08/2025/2027 - Supply and Delivery of Gas cylinders and Cooking Gas",
  "TUM/REG/03/2025/2027 - Supply and Delivery of Foods Stuffs",
  "TUM/REG/29/2025/2027 - Provision of Insurance Services",
  "TUM/REG/24/2025/2027 - Design, Printing & Delivery of Promotion Communication& Corporate branded materials",
  "TUM/REG/19/2025/2027 - Supply, Delivery and Installation of Computer Software and Networking Materials",
  "TUM/REG/14/2025/2027 - Supply, Delivery and Installation of Computers, Laptops, Printers, Photocopiers, Scanners and Accessories",
];

export default function InteractiveSupplierRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const router = useRouter();
  interface FormData {
    name: string;
    registration_category: string;
    business_registration_number: string;
    tax_pin: string;
    tax_compliance_number: string;
    tax_compliance_date: string;
    director_name: string;
    director_contact: string;
    county_of_operation: string;
    business_permit_number: string;
    agpo_certificate_number: string;
    postal_address: string;
    physical_address: string;
    email: string;
    supply_category: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    registration_category: "",
    business_registration_number: "",
    tax_pin: "",
    tax_compliance_number: "",
    tax_compliance_date: "",
    director_name: "",
    director_contact: "",
    county_of_operation: "",
    business_permit_number: "",
    agpo_certificate_number: "",
    postal_address: "",
    physical_address: "",
    email: "",
    supply_category: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  const handleLogout = () => {
    logoutUser();
  };

  const formSteps = [
    {
      title: "Basic Information",
      fields: ["name", "registration_category"],
      description: "Start with your company's basic details",
    },
    {
      title: "Registration & Tax Details",
      fields: [
        "business_registration_number",
        "tax_pin",
        "tax_compliance_number",
        "tax_compliance_date",
      ],
      description: "Provide your official registration and tax information",
    },
    {
      title: "Management & Location",
      fields: ["director_name", "director_contact", "county_of_operation"],
      description: "Director information and operational location",
    },
    {
      title: "Permits & Certificates",
      fields: ["business_permit_number", "agpo_certificate_number"],
      description: "Business permits and AGPO certification (if applicable)",
    },
    {
      title: "Contact Information",
      fields: ["postal_address", "physical_address", "email"],
      description: "How we can reach your business",
    },
    {
      title: "Supply Category",
      fields: ["supply_category"],
      description: "Select your area of specialization",
    },
  ];

  const fieldLabels = {
    name: "Company/Supplier Name",
    registration_category: "Registration Category",
    business_registration_number: "Business Registration Number",
    tax_pin: "KRA Tax PIN",
    tax_compliance_number: "Tax Compliance Certificate Number",
    tax_compliance_date: "Tax Compliance Date",
    director_name: "Director/Owner Name",
    director_contact: "Director Contact (Phone)",
    county_of_operation: "County of Operation",
    business_permit_number: "Business Permit Number",
    agpo_certificate_number: "AGPO Certificate Number",
    postal_address: "Postal Address",
    physical_address: "Physical Address",
    email: "Email Address",
    supply_category: "Supply Category",
  };

  const fieldHelp = {
    name: "Enter the full legal name of your business as registered",
    registration_category:
      "Select the category that applies to your business for preferential treatment",
    business_registration_number:
      "Your Certificate of Registration number from the Registrar of Companies",
    tax_pin: "Your Kenya Revenue Authority Personal Identification Number",
    tax_compliance_number: "Certificate number showing you're tax compliant",
    tax_compliance_date: "Date when your tax compliance certificate was issued",
    director_name: "Full name of the company director or business owner",
    director_contact: "Phone number of the director (format: +254... or 07...)",
    county_of_operation: "The county where your business primarily operates",
    business_permit_number:
      "Your county/municipal business permit number (optional)",
    agpo_certificate_number:
      "Access to Government Procurement Opportunities certificate (optional)",
    postal_address: "Your business postal address (P.O. Box...)",
    physical_address: "Street address where your business is located",
    email: "Business email address for official communication",
    supply_category:
      "Choose the category that best matches what your business supplies",
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as keyof FormData]: value });

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors({ ...errors, [name as keyof FormData]: "" });
    }
  };

  const validateCurrentStep = () => {
    const currentFields = formSteps[currentStep].fields;
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    currentFields.forEach((field) => {
      // Skip validation for optional fields
      if (
        field === "agpo_certificate_number" ||
        field === "business_permit_number"
      ) {
        return;
      }

      if (!formData[field as keyof FormData]) {
        newErrors[field as keyof FormData] = "This field is required";
      }

      // Email validation
      if (field === "email" && formData[field]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field])) {
          newErrors[field] = "Please enter a valid email address";
        }
      }

      // Phone validation
      if (field === "director_contact" && formData[field]) {
        const phoneRegex = /^(\+254|0)[1-9]\d{8}$/;
        if (!phoneRegex.test(formData[field])) {
          newErrors[field] = "Please enter a valid Kenyan phone number";
        }
      }

      // Tax PIN validation (should be 11 characters)
      if (field === "tax_pin" && formData[field]) {
        if (formData[field].length !== 11) {
          newErrors[field] = "Tax PIN should be 11 characters";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(Math.min(currentStep + 1, formSteps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/suppliers/create.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("✅ Supplier registered successfully!");
        // Reset form
        setFormData({
          name: "",
          registration_category: "",
          business_registration_number: "",
          tax_pin: "",
          tax_compliance_number: "",
          tax_compliance_date: "",
          director_name: "",
          director_contact: "",
          county_of_operation: "",
          business_permit_number: "",
          agpo_certificate_number: "",
          postal_address: "",
          physical_address: "",
          email: "",
          supply_category: "",
        });
        setCurrentStep(0);
      } else {
        alert(`❌ Registration failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`❌ Registration failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / formSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Supplier Registration
          </h1>
          <p className="text-gray-600">
            Complete your registration to become an approved supplier
          </p>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Step {currentStep + 1}: {formSteps[currentStep].title}
          </h2>
          <p className="text-gray-600">{formSteps[currentStep].description}</p>
        </div>

        <div className="space-y-6">
          {formSteps[currentStep].fields.map((field) => (
            <div key={field} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {fieldLabels[field as keyof FormData]}
                {field !== "agpo_certificate_number" &&
                  field !== "business_permit_number" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
              </label>

              <div className="text-xs text-gray-500 mb-2">
                {fieldHelp[field as keyof FormData]}
              </div>

              {field === "registration_category" ? (
                <select
                  name={field}
                  value={formData[field as keyof FormData]}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field as keyof FormData]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select Registration Category</option>
                  <option value="General">General</option>
                  <option value="PWDS">PWDS (Persons with Disabilities)</option>
                  <option value="Women">Women</option>
                  <option value="Youth">Youth</option>
                </select>
              ) : field === "county_of_operation" ? (
                <select
                  name={field}
                  value={formData[field as keyof FormData]}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field as keyof FormData]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select County</option>
                  {counties.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              ) : field === "supply_category" ? (
                <select
                  name={field}
                  value={formData[field as keyof FormData]}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field as keyof FormData]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select Supply Category</option>
                  {supplyCategories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    field === "email"
                      ? "email"
                      : field === "tax_compliance_date"
                      ? "date"
                      : "text"
                  }
                  name={field}
                  value={formData[field as keyof FormData]}
                  onChange={handleChange}
                  placeholder={`Enter ${fieldLabels[
                    field as keyof FormData
                  ].toLowerCase()}`}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field as keyof FormData]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              )}

              {errors[field as keyof FormData] && (
                <p className="text-red-500 text-sm">
                  {errors[field as keyof FormData]}
                </p>
              )}
            </div>
          ))}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep === formSteps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Form Summary */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Form Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {Object.entries(formData).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="flex">
                    <span className="text-gray-600 w-40 truncate font-medium">
                      {fieldLabels[key as keyof FormData]}:
                    </span>
                    <span className="text-gray-800 flex-1">{value}</span>
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
