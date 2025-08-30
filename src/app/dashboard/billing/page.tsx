'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { 
  CreditCard,
  Check,
  Zap,
  Crown,
  Calendar,
  Download,
  ExternalLink
} from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'month',
    videos: 2,
    storage: '1 GB',
    properties: 1,
    features: [
      '2 video generations per month',
      '1 property',
      '1 GB storage',
      'Basic support'
    ],
    current: true
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    videos: 50,
    storage: '50 GB',
    properties: 5,
    features: [
      '50 video generations per month',
      '5 properties',
      '50 GB storage',
      'Priority support',
      'Advanced analytics',
      'Custom branding'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 99,
    period: 'month',
    videos: -1,
    storage: '500 GB',
    properties: -1,
    features: [
      'Unlimited video generations',
      'Unlimited properties',
      '500 GB storage',
      '24/7 dedicated support',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'White-label solution'
    ]
  }
]

const invoices = [
  {
    id: 'INV-001',
    date: '2024-01-15',
    amount: 29,
    status: 'paid',
    plan: 'Pro Plan'
  },
  {
    id: 'INV-002',
    date: '2023-12-15',
    amount: 29,
    status: 'paid',
    plan: 'Pro Plan'
  },
  {
    id: 'INV-003',
    date: '2023-11-15',
    amount: 29,
    status: 'paid',
    plan: 'Pro Plan'
  }
]

export default function BillingPage() {
  const { user } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const currentPlan = plans.find(plan => plan.name.toLowerCase() === user?.plan) || plans[0]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            <p className="text-gray-600">You are currently on the {currentPlan.name} plan</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${currentPlan.price}<span className="text-lg text-gray-500">/{currentPlan.period}</span>
            </div>
            {currentPlan.name !== 'Free' && (
              <p className="text-sm text-gray-500">Next billing: Jan 15, 2024</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-900">
              {user?.videosUsed || 0} / {currentPlan.videos === -1 ? '∞' : currentPlan.videos}
            </div>
            <p className="text-sm text-gray-600">Videos Used</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-900">2.1 GB / {currentPlan.storage}</div>
            <p className="text-sm text-gray-600">Storage Used</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-900">
              3 / {currentPlan.properties === -1 ? '∞' : currentPlan.properties}
            </div>
            <p className="text-sm text-gray-600">Properties</p>
          </div>
        </div>

        {currentPlan.name !== 'Enterprise' && (
          <Button className="bg-primary hover:bg-primary/90">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </div>

      {/* Available Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Available Plans</h2>
          
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly <span className="text-green-600 ml-1">(-20%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = billingPeriod === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price
            const isCurrent = plan.name.toLowerCase() === user?.plan
            
            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl border-2 p-8 ${
                  plan.popular
                    ? 'border-primary shadow-lg'
                    : isCurrent
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    ${price}
                    <span className="text-lg text-gray-500">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-green-600 mt-1">Save ${(plan.price * 12) - (price * 12)} per year</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    isCurrent
                      ? 'bg-green-500 hover:bg-green-600'
                      : plan.popular
                      ? 'bg-primary hover:bg-primary/90'
                      : ''
                  }`}
                  variant={isCurrent ? 'default' : plan.popular ? 'default' : 'outline'}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No billing history yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-0 font-medium text-gray-900">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-right py-3 px-0 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-4 px-0">
                      <span className="font-medium text-gray-900">{invoice.id}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{invoice.plan}</td>
                    <td className="py-4 px-4 text-gray-900 font-medium">${invoice.amount}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-0 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}