import Image from "next/image"
import Link from "next/link"
import { ClipboardList, User, Truck, Building2, Shield } from "lucide-react"

// Home page - login portal
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="relative h-48 w-full">
            <Image
              src="/bulkflow_TMS_true_transparent.png"
              alt="BulkFlow TMS"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-center text-gray-300">
            Select your login method to continue.
          </p>

          <Link
            href="/login/admin"
            className="flex items-center gap-3 rounded-lg bg-purple-600 p-4 text-white transition-colors hover:bg-purple-700"
          >
            <Shield className="h-6 w-6" />
            <span className="text-lg font-medium">Login as Admin</span>
          </Link>

          <Link
            href="/login/dispatcher"
            className="flex items-center gap-3 rounded-lg bg-primary p-4 text-white transition-colors hover:bg-primary-hover"
          >
            <ClipboardList className="h-6 w-6" />
            <span className="text-lg font-medium">Login as Dispatcher</span>
          </Link>

          <Link
            href="/login/driver"
            className="flex items-center gap-3 rounded-lg bg-navy-lighter p-4 text-white transition-colors hover:bg-navy-light"
          >
            <User className="h-6 w-6" />
            <span className="text-lg font-medium">Login as Driver</span>
          </Link>

          <Link
            href="/login/carrier"
            className="flex items-center gap-3 rounded-lg bg-navy-lighter p-4 text-white transition-colors hover:bg-navy-light"
          >
            <Truck className="h-6 w-6" />
            <span className="text-lg font-medium">Login as Carrier</span>
          </Link>

          <Link
            href="/login/customer"
            className="flex items-center gap-3 rounded-lg bg-navy-lighter p-4 text-white transition-colors hover:bg-navy-light"
          >
            <Building2 className="h-6 w-6" />
            <span className="text-lg font-medium">Login as Customer</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

