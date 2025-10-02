'use client'

import {
  Youtube,
  Headphones,
  Book,
  MessageCircle
} from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* How to use Hospup */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">How to use Hospup</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* YouTube Tutorial */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-8">
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all">
                <div className="text-center">
                  <Youtube className="w-16 h-16 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">Watch Tutorial</p>
                </div>
              </div>
            </div>

            {/* 3 Steps Process */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Started in 3 Steps</h3>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-primary/20"></div>

                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="flex items-start relative">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-semibold text-xs z-10">
                      1
                    </div>
                    <div className="ml-3 flex-1">
                      <span className="text-sm font-medium text-gray-600">Add Your Property</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start relative">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-semibold text-xs z-10">
                      2
                    </div>
                    <div className="ml-3 flex-1">
                      <span className="text-sm font-medium text-gray-600">Upload Content</span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start relative">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-semibold text-xs z-10">
                      3
                    </div>
                    <div className="ml-3 flex-1">
                      <span className="text-sm font-medium text-gray-600">Generate Videos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Need Help */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Our support team is here to help you create amazing videos.
                </p>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="bg-primary p-2 rounded-lg">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Contact Support</span>
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Documentation</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Find answers to common questions and learn how to get the most out of Hospup.
                </p>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="bg-primary p-2 rounded-lg">
                    <Book className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">View Documentation</span>
                </div>
              </div>
            </div>

            {/* Community */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Join our community to share tips, ask questions, and connect with other users.
                </p>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="bg-primary p-2 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Join Community</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}