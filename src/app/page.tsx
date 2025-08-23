import Link from "next/link";
import { GraduationCap, Users, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Campus Arrival Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to your campus arrival experience. Choose your role below to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Student Section */}
          <Link href="/student" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Student</h2>
                <p className="text-gray-600 mb-6">
                  Access your arrival checklist, view campus map, check your token, and stay updated with important messages.
                </p>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Login with Roll No & Birth Date
                </div>
              </div>
            </div>
          </Link>

          {/* Volunteer Section */}
          <Link href="/volunteer" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Volunteer</h2>
                <p className="text-gray-600 mb-6">
                  Manage student progress, update status, search students, and view real-time dashboard statistics.
                </p>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Login with Username & Password
                </div>
              </div>
            </div>
          </Link>

          {/* Admin Section */}
          <Link href="/admin" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin</h2>
                <p className="text-gray-600 mb-6">
                  Manage volunteers, broadcast messages, edit FAQs, and oversee the entire arrival process.
                </p>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Administrative Access
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Need help? Contact the campus support team
          </p>
        </div>
      </div>
    </div>
  );
}
