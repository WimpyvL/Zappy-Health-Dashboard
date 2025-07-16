
"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/client";

type Appointment = {
    time: string;
    patientName: string;
    type: string;
    date: Date;
}

type AppointmentsByDate = {
    [key: string]: Appointment[];
}

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [appointments, setAppointments] = React.useState<AppointmentsByDate>({});
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchAppointments = React.useCallback(async (month: Date) => {
    setLoading(true);
    try {
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const sessionsCollection = collection(db, "sessions");
        const q = query(
            sessionsCollection, 
            where("date", ">=", Timestamp.fromDate(start)),
            where("date", "<=", Timestamp.fromDate(end)),
            orderBy("date", "asc")
        );
        const querySnapshot = await getDocs(q);
        const appointmentsByDate: AppointmentsByDate = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const apptDate = (data.date as Timestamp).toDate();
            const dateString = format(apptDate, "yyyy-MM-dd");
            if (!appointmentsByDate[dateString]) {
                appointmentsByDate[dateString] = [];
            }
            appointmentsByDate[dateString].push({
                time: format(apptDate, "hh:mm a"),
                patientName: data.patientName || "Unknown Patient",
                type: data.type || "Appointment",
                date: apptDate,
            });
        });
        setAppointments(appointmentsByDate);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({ variant: 'destructive', title: 'Failed to load appointments.' });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAppointments(currentMonth);
  }, [fetchAppointments, currentMonth]);

  const selectedAppointments = date ? appointments[format(date, "yyyy-MM-dd")] || [] : [];
  const daysWithAppointments = Object.keys(appointments).map(dateStr => new Date(dateStr));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Appointment Calendar</h1>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-0 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="p-4"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                            day_today: "bg-accent text-accent-foreground",
                        }}
                        modifiers={{
                           hasAppointment: daysWithAppointments,
                        }}
                        modifiersClassNames={{
                           hasAppointment: "border-2 border-primary rounded-md",
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                Appointments for{" "}
                {date ? format(date, "PPP") : "No date selected"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : selectedAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {selectedAppointments.map((app, index) => (
                    <li key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-20 text-sm font-medium text-foreground pt-1">{app.time}</div>
                      <div className="flex-1 border-l-2 border-primary pl-4">
                        <p className="font-semibold">{app.patientName}</p>
                        <p className="text-sm text-muted-foreground">{app.type}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">No appointments for this day.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
