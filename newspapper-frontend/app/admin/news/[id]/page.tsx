import { AdminNewsDetailContent } from '@/components/admin/admin-news-detail-content';

export default function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminNewsDetailContent params={params} />;
}
