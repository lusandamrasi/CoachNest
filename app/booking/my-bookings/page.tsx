'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Booking {
    id: string;
    date: string;
    time: string;
    coachName: string;
    coachId: string;
    confirmed: boolean;
}

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const supabase = createClient();

        const fetchBookings = async () => {
            try {
                // Get current user
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                setUser(user);

                if (!user) {
                    setLoading(false);
                    return;
                }

                // Fetch bookings
                const { data, error } = await supabase
                    .from('bookings')
                    .select(`
                        id,
                        date,
                        start_time,
                        end_time,
                        status,
                        coach_profiles (
                            id,
                            profiles (
                                full_name
                            )
                        )
                    `)
                    .eq('student_id', user.id)
                    .order('date', { ascending: true });

                if (error) {
                    throw error;
                }

                const formatted: Booking[] =
                    data?.map((booking: any) => ({
                        id: booking.id,
                        date: booking.date,
                        time: `${booking.start_time} - ${booking.end_time}`,
                        coachName:
                            booking.coach_profiles?.profiles?.full_name ??
                            'Unknown Coach',
                        coachId: booking.coach_profiles?.id ?? '',
                        confirmed: booking.status === 'confirmed',
                    })) ?? [];

                setBookings(formatted);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return <p>Loading your bookings...</p>;
    }

    if (!user) {
        return <p>Please log in to view your bookings.</p>;
    }

    if (bookings.length === 0) {
        return <p>You have no bookings at the moment.</p>;
    }

    return (
        <div>
            <h1>My Bookings</h1>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Coach</th>
                        <th>Confirmed</th>
                    </tr>
                </thead>

                <tbody>
                    {bookings.map((booking) => (
                        <tr key={booking.id}>
                            <td>{booking.date}</td>

                            <td>{booking.time}</td>

                            <td>
                                <Link
                                    href={`/clients/booking/${booking.coachId}`}
                                >
                                    {booking.coachName}
                                </Link>
                            </td>

                            <td>
                                {booking.confirmed ? 'Yes' : 'Pending'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}