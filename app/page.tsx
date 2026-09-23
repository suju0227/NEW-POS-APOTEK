import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import PosWorkspace from '@/components/pos/pos-workspace'
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return <PosWorkspace />
}
