export function isVerifiedCoach(coach: {
  verification_status: string | null
  id_document_url: string | null
}): boolean {
  return coach.verification_status === 'verified' && !!coach.id_document_url
}
