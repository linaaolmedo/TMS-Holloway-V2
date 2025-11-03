import { redirect } from 'next/navigation'

export default function CarrierPage() {
  // Redirect to load board - carrier's main landing page
  redirect('/carrier/load-board')
}

