"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Users,
  Activity,
  CreditCard,
  Plus,
  MoveRight,
  ClipboardList,
} from "lucide-react";

const chartData = [
  { month: "Jan", revenue: 18600 },
  { month: "Feb", revenue: 30500 },
  { month: "Mar", revenue: 23700 },
  { month: "Apr", revenue: 27800 },
  { month: "May", revenue: 18900 },
  { month: "Jun", revenue: 23900 },
  { month: "Jul", revenue: 34900 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

const recentConsultations = [
  { id: 1, patient: "Olivia Martin", status: "Approved", amount: 150.0 },
  { id: 2, patient: "Jackson Lee", status: "Pending", amount: 250.0 },
  { id: 3, patient: "Isabella Nguyen", status: "Approved", amount: 300.5 },
  { id: 4, patient: "William Kim", status: "Denied", amount: 100.0 },
  { id: 5, patient: "Sofia Davis", status: "Pending", amount: 175.75 },
];

const tasks = [
    {id: 1, description: "Review new patient intake forms", priority: "High"},
    {id: 2, description: "Follow up with Dr. Smith on lab results", priority: "Medium"},
    {id: 3, description: "Approve pending prescription refills", priority: "Low"},
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
            <Button variant="outline">Export</Button>
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Patient
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+12.1% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124,531.89</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              A summary of revenue over the last 7 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Consultations</CardTitle>
            <CardDescription>
              A list of the most recent patient consultations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConsultations.map((consult) => (
                  <TableRow key={consult.id}>
                    <TableCell className="font-medium">
                      {consult.patient}
                    </TableCell>
                    <TableCell>
                      <Badge variant={consult.status === 'Approved' ? 'default' : consult.status === 'Pending' ? 'secondary' : 'destructive'}>
                        {consult.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${consult.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>
                    Your immediate to-do items.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex items-center">
                           <div className="flex-1">
                                <p className="text-sm font-medium">{task.description}</p>
                                <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'} className="mt-1">{task.priority} Priority</Badge>
                           </div>
                           <Button variant="ghost" size="sm">View</Button>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full">
                    View All Tasks <MoveRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent actions across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <Activity className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                            <p className="text-sm"><span className="font-medium">Dr. Evans</span> approved a prescription for <span className="font-medium">Liam Johnson</span>.</p>
                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Users className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                            <p className="text-sm">New patient <span className="font-medium">Ava Jones</span> completed the intake form.</p>
                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                            <p className="text-sm">A payment of <span className="font-medium">$150.00</span> was processed for <span className="font-medium">Olivia Smith</span>.</p>
                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
