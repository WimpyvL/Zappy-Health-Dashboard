import EnhancedIntakeFormPageClient from './[flowId]/client-page';

export async function generateStaticParams() {
  return [];
}

export default function EnhancedIntakeFormPage({ params }: { params?: { flowId: string } }) {
  return <EnhancedIntakeFormPageClient flowId={params?.flowId ?? ''} />;
}
