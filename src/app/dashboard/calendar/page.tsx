// This file remains unchanged, as it was not part of the requested reconstruction.
"use client";

import * as React from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const today = new Date();

// Mock data for appointments for the next few days
const appointments: { [key: string]: Appointment[] } = {
  [format(today, "yyyy-MM-dd")]: [
    { time: "09:00 AM", patient: "John Doe", type: "Check-up" },
    { time: "11:30 AM", patient: "Jane Smith", type: "Follow-up" },
  ],
  [format(addDays(today, 2), "yyyy-MM-dd")]: [
    { time: "02:00 PM", patient: "Peter Jones", type: "Consultation" },
  ],
  [format(addDays(today, 5), "yyyy-MM-dd")]: [
    { time: "10:00 AM", patient: "Mary Williams", type: "Check-up" },
    { time: "01:00 PM", patient: "David Brown", type: "Procedure" },
    { time: "03:30 PM", patient: "Sarah Miller", type: "Consultation" },
  ],
};

type Appointment = {
    time: string;
    patient: string;
    type: string;
}

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(today);
  const [selectedAppointments, setSelectedAppointments] = React.useState<Appointment[]>([]);

  React.useEffect(() => {
    if (date) {
      const dateString = format(date, "yyyy-MM-dd");
      setSelectedAppointments(appointments[dateString] || []);
    }
  }, [date]);

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
                        className="p-4"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                            day_today: "bg-accent text-accent-foreground",
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
              {selectedAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {selectedAppointments.map((app, index) => (
                    <li key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-20 text-sm font-medium text-foreground pt-1">{app.time}</div>
                      <div className="flex-1 border-l-2 border-primary pl-4">
                        <p className="font-semibold">{app.patient}</p>
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