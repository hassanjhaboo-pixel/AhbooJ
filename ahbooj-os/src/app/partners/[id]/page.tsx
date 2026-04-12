import { ComingSoon } from '@/components/ui/ComingSoon'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ComingSoon module="Partner" description={`ID: ${id}`} />
}
