
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { TaskFormModal } from "./tasks/components/task-form-modal"
import { CreateOrderModal } from "./orders/components/create-order-modal"
import { shouldUseDemoData, demoDataService } from "@/lib/demo-data";
import { getFirebaseFirestore } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton"


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

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    upcomingSessions: 0,
    pendingOrders: 0,
    newConsultations: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [loadingStats, setLoadingStats] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoadingStats(true);
      try {
        // Use demo data in development mode
        if (shouldUseDemoData()) {
          console.log('📊 Using demo data for dashboard stats');
          const demoStats = await demoDataService.getDashboardStats();
          setStats({
            totalPatients: demoStats.totalPatients,
            upcomingSessions: demoStats.upcomingSessions,
            pendingOrders: demoStats.pendingOrders,
            newConsultations: demoStats.newConsultations,
          });
          return;
        }

        // Real Firebase data for production
        const db = getFirebaseFirestore();
        if (!db) {
          throw new Error('Firestore not initialized');
        }

        const patientsCollection = collection(db, "patients");
        const patientsSnapshot = await getDocs(patientsCollection);
        
        const sessionsCollection = collection(db, "sessions");
        const upcomingSessionsQuery = query(sessionsCollection, where("date", ">=", Timestamp.now()));
        const upcomingSessionsSnapshot = await getDocs(upcomingSessionsQuery);
        
        const ordersCollection = collection(db, "orders");
        const pendingOrdersQuery = query(ordersCollection, where("status", "in", ["Processing", "Pending"]));
        const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);

        const newConsultationsQuery = query(sessionsCollection, where("status", "in", ["Scheduled", "Pending"]));
        const newConsultationsSnapshot = await getDocs(newConsultationsQuery);

        setStats({
          totalPatients: patientsSnapshot.size,
          upcomingSessions: upcomingSessionsSnapshot.size,
          pendingOrders: pendingOrdersSnapshot.size,
          newConsultations: newConsultationsSnapshot.size,
        });
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Error fetching dashboard stats: ", error);
        toast({
          variant: "destructive",
          title: "Error loading dashboard data",
          description: "Could not retrieve summary data from the database.",
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [toast])

  const handleRefreshSessions = () => {
    toast({
      title: "Sessions Refreshed",
      description: "The list of today's sessions has been updated.",
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


  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toString()}
          description="+2 since last week"
          icon={Users}
          loading={loadingStats}
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats.upcomingSessions.toString()}
          description="No sessions today"
          icon={Calendar}
          loading={loadingStats}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          description="Awaiting processing"
          icon={Package}
          loading={loadingStats}
        />
        <StatCard
          title="New Consultations"
          value={stats.newConsultations.toString()}
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
