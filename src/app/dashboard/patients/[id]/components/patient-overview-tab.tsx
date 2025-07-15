
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Package } from "lucide-react";


const timelineEvents = [
    { date: "7/15/2025", title: "Patient profile accessed", description: "Provider reviewed patient information" },
    { date: "7/14/2025", title: "Account created", description: "Patient registered in system" },
    { date: "7/8/2025", title: "Initial consultation scheduled", description: "Upcoming appointment scheduled" },
];

const activeOrders = [
    { title: "No active medications", description: "Auto-refill • 2 refills remaining • Next: Jan 15", status: "Active", statusColor: "green" },
    { title: "No additional medications", description: "Sent to CVS Main Street • Today 3:45 PM", status: "Sent", statusColor: "blue" },
]

const upcomingSessions = [
    { title: "Weight Management Check-in", time: "Tomorrow • 2:00 PM • Virtual Visit" },
    { title: "Follow-up Consultation", time: "Feb 15, 2025 • 10:30 AM • Virtual Session" },
]

export function PatientOverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Active Care Timeline</CardTitle>
                  <Button variant="ghost" size="sm">Last 30 days <ChevronDown className="h-4 w-4 ml-1" /></Button>
              </CardHeader>
              <CardContent>
                  <div className="relative pl-4">
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>
                      {timelineEvents.map((event, index) => (
                          <div key={index} className="flex gap-4 mb-6 last:mb-0">
                              <div className="flex-shrink-0 text-right text-sm text-muted-foreground w-20">{event.date}</div>
                              <div className="relative">
                                  <div className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
                                  <p className="font-semibold">{event.title}</p>
                                  <p className="text-sm text-muted-foreground">{event.description}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle>Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                  {activeOrders.map((order, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border-l-4 border-green-500 bg-green-50/50 rounded-r-lg">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                              <Package className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                              <p className="font-semibold">{order.title}</p>
                              <p className="text-sm text-muted-foreground">{order.description}</p>
                          </div>
                          <Badge className={`capitalize bg-${order.statusColor}-100 text-${order.statusColor}-800 hover:bg-${order.statusColor}-200`}>{order.status}</Badge>
                      </div>
                  ))}
                  </div>
                    <Button variant="outline" className="mt-4">View All Orders</Button>
              </CardContent>
          </Card>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card>
          <CardHeader><CardTitle>Administrative Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-green-100 text-green-900">
                  <p className="font-semibold">Insurance Verified</p>
                  <p className="text-sm">Valid through Feb 2025</p>
              </div>
              <div className="p-3 rounded-lg border">
                  <p className="font-semibold">Prior Auth</p>
                  <p className="text-sm text-muted-foreground">Prior authorization status varies by medication</p>
              </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
              <Button className="w-full justify-start"><Briefcase className="h-4 w-4 mr-2" />Add Session</Button>
              <Button variant="secondary" className="w-full justify-start"><FileText className="h-4 w-4 mr-2" />Document Visit</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming Sessions</CardTitle></CardHeader>
          <CardContent>
              {upcomingSessions.map((session, index) => (
                  <div key={index} className={index > 0 ? "mt-4" : ""}>
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="font-semibold text-blue-900">{session.title}</p>
                          <p className="text-sm text-blue-800">{session.time}</p>
                      </div>
                      {index === 0 && <Button variant="outline" className="w-full mt-2">Reschedule</Button>}
                      {index > 0 && <Separator className="my-4" />}
                  </div>
              ))}
              <Button variant="outline" className="mt-4 w-full">View All Sessions</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
