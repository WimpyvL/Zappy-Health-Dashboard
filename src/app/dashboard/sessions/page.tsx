"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Search, Filter, X, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ScheduleSessionModal } from "./components/schedule-session-modal";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from "date-fns";
import { useSessions, useCreateSession, useUpdateSessionStatus, useProviders } from '@/services/database/hooks';
import { telehealthFlowOrchestrator } from '@/services/telehealthFlowOrchestrator';
import { Skeleton } from "@/components/ui/skeleton";
import { Timestamp } from 'firebase/firestore';

const SESSION_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled', 'followup'] as const;
type SessionStatus = typeof SESSION_STATUSES[number];

const SESSION_TYPES = [
  'consultation',
  'follow-up',
  'initial-assessment',
  'medication-review',
  'therapy-session',
  'lab-review',
  'urgent-care',
  'wellness-check'
] as const;

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last-7-days' },
  { label: 'Last 30 days', value: 'last-30-days' },
  { label: 'This month', value: 'this-month' },
  { label: 'Last month', value: 'last-month' },
  { label: 'Custom range', value: 'custom' },
] as const;

interface Session {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  type: string;
  plan?: string;
  provider?: string;
  date: string;
  status: SessionStatus;
}

const StatusBadge = ({ status }: { status: SessionStatus }) => {
  const statusConfig: Record<SessionStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
    'in-progress': { label: "In Progress", className: "bg-blue-100 text-blue-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
    followup: { label: "Follow-up", className: "bg-purple-100 text-purple-800" },
  };
  const currentStatus = statusConfig[status] || statusConfig.pending;
  return <Badge variant="secondary" className={`${currentStatus.className} hover:${currentStatus.className}`}>{currentStatus.label}</Badge>;
};

export default function SessionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  
  // Get all filter parameters from URL
  const [searchInput, setSearchInput] = React.useState(searchParams.get('searchTerm') || '');
  
  const status = searchParams.get('status');
  const searchTerm = searchParams.get('searchTerm');
  const type = searchParams.get('type');
  const provider = searchParams.get('provider');
  const datePreset = searchParams.get('datePreset');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  // Use the sessions hook with proper parameter handling
  const sessionsParams = React.useMemo(() => ({
    ...(status && { status }),
    ...(searchTerm && { searchTerm }),
    ...(type && { type }),
    ...(provider && { provider }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  }), [status, searchTerm, type, provider, dateFrom, dateTo]);

  const { data: sessionsData, isLoading: loading } = useSessions(sessionsParams);
  const { data: providersData } = useProviders();
  
  const sessions = React.useMemo(() => {
    if (!sessionsData?.data) return [];
    
    return sessionsData.data.map((s: any) => ({
      ...s,
      date: s.date && s.date.seconds ? format(new Date(s.date.seconds * 1000), "MMM dd, yyyy") : "N/A",
    }));
  }, [sessionsData]);

  const createMutation = useCreateSession();
  const updateStatusMutation = useUpdateSessionStatus();
  
  const handleCreateSession = async (values: any) => {
    try {
      const flowResult = await telehealthFlowOrchestrator.initializeFlow({
        patientId: 'mock-patient-id', // This should come from a patient selection UI
        categoryId: 'general',
      });

      if (!flowResult.success || !flowResult.flow?.id) {
        throw new Error(flowResult.error?.message || "Failed to initiate telehealth flow.");
      }

      const sessionData = {
        patientName: values.patient,
        patientId: 'mock-patient-id',
        patientEmail: 'mock-email@example.com',
        type: values.sessionType,
        plan: values.servicePlan,
        provider: values.provider,
        date: Timestamp.fromDate(new Date(values.dateTime)),
        status: "pending" as const,
        flowId: flowResult.flow.id,
      };

      await createMutation.mutateAsync(sessionData as any);
      toast({ title: "Session Scheduled", description: "A new session has been scheduled." });
      setIsModalOpen(false);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error Scheduling Session", 
        description: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    }
  };

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/sessions?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    updateSearchParams('searchTerm', value || null);
  };

  const handleStatusFilter = (value: string) => {
    updateSearchParams('status', value === 'all' ? null : value);
  };

  const handleTypeFilter = (value: string) => {
    updateSearchParams('type', value === 'all' ? null : value);
  };

  const handleProviderFilter = (value: string) => {
    updateSearchParams('provider', value === 'all' ? null : value);
  };

  const handleDatePresetChange = (preset: string) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (preset) {
      case 'today':
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        from = startOfDay(yesterday);
        to = endOfDay(yesterday);
        break;
      case 'last-7-days':
        from = startOfDay(subDays(today, 7));
        to = endOfDay(today);
        break;
      case 'last-30-days':
        from = startOfDay(subDays(today, 30));
        to = endOfDay(today);
        break;
      case 'this-month':
        from = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
        to = endOfDay(today);
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        from = startOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1));
        to = endOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0));
        break;
      case 'custom':
        // Don't set dates for custom, let user pick
        break;
      default:
        from = undefined;
        to = undefined;
    }

    if (preset !== 'custom' && from && to) {
      updateSearchParams('dateFrom', format(from, 'yyyy-MM-dd'));
      updateSearchParams('dateTo', format(to, 'yyyy-MM-dd'));
      setDateRange({ from, to });
    }
    
    updateSearchParams('datePreset', preset === 'all' ? null : preset);
  };

  const handleCustomDateRange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    
    // Only update URL params if we have valid dates
    if (range.from) {
      updateSearchParams('dateFrom', format(range.from, 'yyyy-MM-dd'));
    } else {
      updateSearchParams('dateFrom', null);
    }
    
    // For single date selection, don't set 'to' until user selects a second date
    if (range.to && range.from && range.to !== range.from) {
      updateSearchParams('dateTo', format(range.to, 'yyyy-MM-dd'));
    } else if (!range.to) {
      updateSearchParams('dateTo', null);
    }
    
    // Only set preset to custom if we have at least a from date
    if (range.from) {
      updateSearchParams('datePreset', 'custom');
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setDateRange({});
    router.push('/dashboard/sessions');
  };

  const hasActiveFilters = status || searchTerm || type || provider || dateFrom || dateTo;

  // Initialize date range from URL params
  React.useEffect(() => {
    if (dateFrom || dateTo) {
      const newRange: { from?: Date; to?: Date } = {};
      if (dateFrom) newRange.from = new Date(dateFrom);
      if (dateTo) newRange.to = new Date(dateTo);
      setDateRange(newRange);
    }
  }, [dateFrom, dateTo]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsModalOpen(true)} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" /> {createMutation.isPending ? "Initializing..." : "Add Session"}
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            {/* Search Bar */}
            <div className="flex flex-col gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Filter */}
                <Select value={status || 'all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={type || 'all'} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {SESSION_TYPES.map((sessionType) => (
                      <SelectItem key={sessionType} value={sessionType} className="capitalize">
                        {sessionType.replace(/-/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Provider Filter */}
                <Select value={provider || 'all'} onValueChange={handleProviderFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providersData?.data?.map((prov: any) => (
                      <SelectItem key={prov.id} value={prov.name}>
                        {prov.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                  <Select value={datePreset || 'all'} onValueChange={handleDatePresetChange}>
                    <SelectTrigger className="w-[140px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      {DATE_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom Date Range Picker */}
                  {datePreset === 'custom' && (
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from || new Date()}
                          selected={dateRange as any}
                          onSelect={(range: any) => {
                            if (range) {
                              // Handle the range selection properly
                              const newRange = {
                                from: range.from || undefined,
                                to: range.to || undefined,
                              };
                              
                              handleCustomDateRange(newRange);
                              
                              // Only close if we have both dates and they're different
                              if (range.from && range.to && range.from !== range.to) {
                                setIsDatePickerOpen(false);
                              }
                            } else {
                              // Clear the range
                              handleCustomDateRange({});
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {status && (
                    <Badge variant="secondary" className="capitalize">
                      Status: {status.replace('-', ' ')}
                      <button
                        onClick={() => handleStatusFilter('all')}
                        className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {type && (
                    <Badge variant="secondary" className="capitalize">
                      Type: {type.replace('-', ' ')}
                      <button
                        onClick={() => handleTypeFilter('all')}
                        className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {provider && (
                    <Badge variant="secondary">
                      Provider: {provider}
                      <button
                        onClick={() => handleProviderFilter('all')}
                        className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => handleSearch('')}
                        className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(dateFrom || dateTo) && (
                    <Badge variant="secondary">
                      Date: {dateFrom && format(new Date(dateFrom), 'MMM dd')}
                      {dateFrom && dateTo && ' - '}
                      {dateTo && format(new Date(dateTo), 'MMM dd, yyyy')}
                      <button
                        onClick={() => {
                          updateSearchParams('dateFrom', null);
                          updateSearchParams('dateTo', null);
                          updateSearchParams('datePreset', null);
                          setDateRange({});
                        }}
                        className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sessions found. {hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first session to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Link href={`/dashboard/patients/${session.patientId}`} className="font-medium text-primary hover:underline">
                          {session.patientName || 'N/A'}
                        </Link>
                        <div className="text-sm text-muted-foreground">{session.patientEmail || session.patientId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {session.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>{session.provider || 'N/A'}</TableCell>
                      <TableCell><StatusBadge status={session.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/sessions/${session.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {SESSION_STATUSES.map(statusOption => (
                              <DropdownMenuItem 
                                key={statusOption} 
                                disabled={session.status === statusOption || updateStatusMutation.isPending}
                                onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status: statusOption })}
                              >
                                Mark as {statusOption.replace(/-/g, ' ')}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <ScheduleSessionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateSession} 
      />
    </>
  );
}
