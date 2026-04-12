import { ComingSoon } from '@/components/ui/ComingSoon'

export default async function Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  return <ComingSoon module="Quality Control" description={`ID: ${batchId}`} />
}
