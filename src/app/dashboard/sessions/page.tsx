import { databaseService, type Session, type Patient } from '@/services/database/index';
import SessionPageClient from './[id]/client-page';

export async function generateStaticParams() {
  // In a real app, you'd fetch all session IDs here.
  // For now, we'll return an empty array to satisfy the build.
  return [];
}

const fetchSessionData = async (sessionId: string): Promise<{ session: Session; patient: Patient | null } | null> => {
    if (!sessionId) return null;
    
    const sessionRes = await databaseService.sessions.getById(sessionId);
    if (sessionRes.error || !sessionRes.data) {
        const errorMessage = sessionRes.error?.message || 'Session not found.';
        throw new Error(errorMessage);
    }
    
    const sessionData = sessionRes.data;
    let patientData = null;

    if (sessionData.patientId) {
        const patientRes = await databaseService.patients.getById(sessionData.patientId);
        if (patientRes.data) {
            patientData = patientRes.data;
        }
    }
    return { session: sessionData, patient: patientData };
};

export default async function EditSessionPage({ params }: { params?: { id: string } }) {
  const data = params ? await fetchSessionData(params.id) : null;

  if (!data) {
    return <div>Session not found.</div>;
  }

  return <SessionPageClient session={data.session} patient={data.patient} />;
}
