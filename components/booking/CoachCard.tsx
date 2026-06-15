import { MapPin, Star, ChevronRight } from 'lucide-react'

export type Coach = {
    id: string
    sport: string
    bio: string | null
    hourly_rate: number | null
    location: string | null
    years_experience: number | null
    profiles: {
        full_name: string | null
        avatar_url: string | null
    }
}

function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function CoachCard({ coach, onBook }: { coach: Coach; onBook: (id: string) => void }) {
    const profile = coach.profiles

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-400" />

            <div className="p-5 flex flex-col gap-4 flex-1">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center shrink-0 border border-blue-100">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name ?? ''}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        ) : (
                            getInitials(profile?.full_name ?? null)
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{profile?.full_name ?? 'Coach'}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-0.5">
                            {coach.sport}
                        </span>
                    </div>
                </div>

                {coach.bio && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{coach.bio}</p>
                )}

                <div className="flex flex-col gap-1.5 mt-auto">
                    {coach.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{coach.location}</span>
                        </div>
                    )}
                    {coach.years_experience != null && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Star className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{coach.years_experience} yr{coach.years_experience !== 1 ? 's' : ''} experience</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
                    <div>
                        {coach.hourly_rate != null ? (
                            <>
                                <span className="text-lg font-bold text-gray-900">${coach.hourly_rate}</span>
                                <span className="text-xs text-gray-400 ml-1">/ hr</span>
                            </>
                        ) : (
                            <span className="text-sm text-gray-400">Rate on request</span>
                        )}
                    </div>
                    <button
                        onClick={() => onBook(coach.id)}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:gap-2 transition-all"
                    >
                        Book
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}