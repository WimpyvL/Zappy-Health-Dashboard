"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Users,
  Calendar,
  Package,
  MessageSquarePlus,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  ClipboardList,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/database'
import { TaskFormModal } from "./tasks/components/task-form-modal"
import { CreateOrderModal } from "./orders/components/create-order-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Timestamp } from "firebase/firestore"

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
  loading?: boolean
}) => (
  <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <>
          <Skeleton className="h-8 w-1/2 mb-2 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </>
      ) : (
        <>
          <div className="text-3xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
)

const fetchDashboardStats = async () => {
  const [
    patientsRes,
    upcomingSessionsRes,
    pendingOrdersRes,
    newConsultationsRes,
  ] = await Promise.all([
    databaseService.patients.getAll(),
    databaseService.sessions.getAll({ filters: [{ field: 'date', op: '>=', value: Timestamp.now() }] }),
    databaseService.orders.getAll({ filters: [{ field: 'status', op: 'in', value: ['Processing', 'Pending'] }] }),
    databaseService.sessions.getAll({ filters: [{ field: 'status', op: 'in', value: ['Scheduled', 'Pending'] }] }),
  ]);

  // Check for errors in responses
  if (patientsRes.error || upcomingSessionsRes.error || pendingOrdersRes.error || newConsultationsRes.error) {
    console.error("Error fetching dashboard stats:", {
        patientsError: patientsRes.error,
        sessionsError: upcomingSessionsRes.error,
        ordersError: pendingOrdersRes.error,
        consultationsError: newConsultationsRes.error,
    });
    throw new Error('Failed to fetch some dashboard statistics.');
  }

  // Safely access data length
  return {
    totalPatients: patientsRes.data?.length || 0,
    upcomingSessions: upcomingSessionsRes.data?.length || 0,
    pendingOrders: pendingOrdersRes.data?.length || 0,
    newConsultations: newConsultationsRes.data?.length || 0,
  };
};

export default function DashboardPage() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast()

  const { data: stats, isLoading: loadingStats, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading dashboard data",
        description: error.message || "Could not retrieve summary data from the database.",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [stats]);


  const handleRefreshSessions = async () => {
    await refetch();
    toast({
      title: "Dashboard Refreshed",
      description: "The dashboard statistics have been updated.",
    });
  };
  
  const handleCreateTask = (values: any) => {
    console.log("Creating task:", values);
    toast({
      title: "Task Created",
      description: `A new task has been assigned to ${values.assignee}.`,
    });
    setIsTaskModalOpen(false);
  };

  const handleCreateOrder = (values: any) => {
    console.log("Creating order:", values);
    toast({
      title: "Order Created",
      description: `New order for patient ${values.patientId} has been created.`,
    });
    setIsOrderModalOpen(false);
  };

  const displayStats = {
    totalPatients: stats?.totalPatients ?? 0,
    upcomingSessions: stats?.upcomingSessions ?? 0,
    pendingOrders: stats?.pendingOrders ?? 0,
    newConsultations: stats?.newConsultations ?? 0,
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={displayStats.totalPatients.toString()}
          description="+2 since last week"
          icon={Users}
          loading={loadingStats}
        />
        <StatCard
          title="Upcoming Sessions"
          value={displayStats.upcomingSessions.toString()}
          description="No sessions today"
          icon={Calendar}
          loading={loadingStats}
        />
        <StatCard
          title="Pending Orders"
          value={displayStats.pendingOrders.toString()}
          description="Awaiting processing"
          icon={Package}
          loading={loadingStats}
        />
        <StatCard
          title="New Consultations"
          value={displayStats.newConsultations.toString()}
          description="Pending review"
          icon={MessageSquarePlus}
          loading={loadingStats}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-cyan-700" />
              <CardTitle className="text-lg text-cyan-900">
                Today&apos;s Sessions
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-yellow-300/80 border-yellow-400 hover:bg-yellow-300/100 text-yellow-900"
                onClick={handleRefreshSessions}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => router.push('/dashboard/sessions')}>View All</Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-48">
            <Calendar className="h-16 w-16 text-cyan-400 mb-4" />
            <p className="text-cyan-800 font-medium">
              No sessions scheduled for today
            </p>
          </CardContent>
          <p className="px-6 pb-4 text-xs text-cyan-600">
            Last updated: {lastUpdated}
          </p>
        </Card>

        <Card className="shadow-md border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-green-700" />
              <CardTitle className="text-lg text-green-900">Tasks</CardTitle>
            </div>
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-48">
            <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
            <p className="text-green-800 font-medium">No pending tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md border-l-4 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-orange-700" />
              <CardTitle className="text-lg text-orange-900">
                Recent Orders
              </CardTitle>
            </div>
            <Button size="sm" onClick={() => setIsOrderModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-48">
            <Package className="h-16 w-16 text-orange-400 mb-4" />
            <p className="text-orange-800 font-medium">No recent orders</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-purple-700" />
              <CardTitle className="text-lg text-purple-900">
                Pending Consultations
              </CardTitle>
            </div>
            <Button size="sm" onClick={() => router.push('/dashboard/sessions')}>View All</Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-48">
            <MessageSquarePlus className="h-16 w-16 text-purple-400 mb-4" />
            <p className="text-purple-800 font-medium">
              No pending consultations
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
    <TaskFormModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
    />
    <CreateOrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
    />
    </>
  )
}
