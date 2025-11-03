import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { ArrowLeft } from 'lucide-react'

export default function DispatcherLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to selection
        </Link>

        <div className="flex justify-center">
          <div className="relative h-32 w-full">
            <Image
              src="/bulkflow_TMS_true_transparent.png"
              alt="BulkFlow TMS"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-navy-light p-6">
          <h2 className="mb-6 text-2xl font-bold text-white">Dispatcher Login</h2>
          <LoginForm userType="dispatcher" redirectPath="/dashboard" />
        </div>
      </div>
    </div>
  )
}

