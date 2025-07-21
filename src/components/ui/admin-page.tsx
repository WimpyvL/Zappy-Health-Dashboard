"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Search, ChevronDown, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

// Configuration types
export interface FilterConfig {
  label: string;
  options: string[];
  value?: string;
  onValueChange?: (value: string) => void;
}

export interface ActionConfig {
  label: string;
  icon?: React.ComponentType<any>;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  permission?: string;
}

export interface StatsConfig {
  label: string;
  value: number | string;
}

export interface AdminPageConfig<T> {
  // Page metadata
  title: string;
  description?: string;
  entityName: string; // e.g., "discount", "pharmacy"
  entityNamePlural: string; // e.g., "discounts", "pharmacies"
  
  // Data fetching
  fetchData: () => Promise<T[]>;
  createEntity: (data: Partial<T>) => Promise<void>;
  updateEntity: (id: string, data: Partial<T>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  
  // Table configuration
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  
  // Stats calculation
  calculateStats?: (data: T[]) => StatsConfig[];
  
  // Actions
  headerActions?: ActionConfig[];
  rowActions?: (item: T) => ActionConfig[];
  
  // Form component
  FormComponent?: React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    entity?: T | null;
    onSubmit: (data: Partial<T>) => Promise<void>;
  }>;
  
  // Permissions
  permissions?: {
    read?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
}

const FilterDropdown = ({ filter }: { filter: FilterConfig }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2">
        {filter.value || filter.label}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {filter.options.map((option) => (
        <DropdownMenuItem 
          key={option} 
          onClick={() => filter.onValueChange?.(option)}
        >
          {option}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export function AdminPage<T extends { id: string }>({
  config
}: {
  config: AdminPageConfig<T>
}) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEntity, setEditingEntity] = React.useState<T | null>(null);
  const [deletingEntityId, setDeletingEntityId] = React.useState<string | null>(null);
  
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Check permissions
  const canRead = !config.permissions?.read || hasPermission(config.permissions.read);
  const canCreate = !config.permissions?.create || hasPermission(config.permissions.create);
  const canUpdate = !config.permissions?.update || hasPermission(config.permissions.update);
  const canDelete = !config.permissions?.delete || hasPermission(config.permissions.delete);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    if (!canRead) return;
    
    setLoading(true);
    try {
      const result = await config.fetchData();
      setData(result);
    } catch (error) {
      console.error(`Error fetching ${config.entityNamePlural}:`, error);
      toast({
        variant: "destructive",
        title: `Error fetching ${config.entityNamePlural}`,
        description: `Could not retrieve ${config.entityName} data from the database.`,
      });
    } finally {
      setLoading(false);
    }
  }, [config, canRead, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter((item) => {
      return config.columns.some((column) => {
        const value = item[column.key];
        return value && String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, config.columns]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!config.calculateStats) return [];
    return config.calculateStats(data);
  }, [data, config.calculateStats]);

  // Modal handlers
  const handleOpenAddModal = () => {
    if (!canCreate) return;
    setEditingEntity(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entity: T) => {
    if (!canUpdate) return;
    setEditingEntity(entity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntity(null);
  };

  // CRUD operations
  const handleFormSubmit = async (formData: Partial<T>) => {
    try {
      if (editingEntity) {
        await config.updateEntity(editingEntity.id, formData);
        toast({
          title: `${config.entityName} Updated`,
          description: `The ${config.entityName} has been successfully updated.`,
        });
      } else {
        await config.createEntity(formData);
        toast({
          title: `${config.entityName} Created`,
          description: `The ${config.entityName} has been successfully created.`,
        });
      }
      
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error(`Error saving ${config.entityName}:`, error);
      toast({
        variant: "destructive",
        title: `Error saving ${config.entityName}`,
        description: `An error occurred while saving the ${config.entityName}.`,
      });
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!canDelete) return;
    
    try {
      await config.deleteEntity(id);
      toast({
        title: `${config.entityName} Deleted`,
        description: `The ${config.entityName} has been successfully deleted.`,
      });
      fetchData();
    } catch (error) {
      console.error(`Error deleting ${config.entityName}:`, error);
      toast({
        variant: "destructive",
        title: `Error deleting ${config.entityName}`,
        description: `An error occurred while deleting the ${config.entityName}.`,
      });
    } finally {
      setDeletingEntityId(null);
    }
  };

  // Row actions with permissions
  const getRowActions = (item: T): React.ReactNode => {
    const customActions = config.rowActions?.(item) || [];
    const defaultActions: ActionConfig[] = [];

    if (canUpdate) {
      defaultActions.push({
        label: "Edit",
        icon: Edit,
        onClick: () => handleOpenEditModal(item),
        variant: "ghost",
      });
    }

    if (canDelete) {
      defaultActions.push({
        label: "Delete",
        icon: Trash2,
        onClick: () => setDeletingEntityId(item.id),
        variant: "ghost",
      });
    }

    const allActions = [...customActions, ...defaultActions];

    return (
      <div className="flex gap-1">
        {allActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant || "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={action.onClick}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </Button>
          );
        })}
      </div>
    );
  };

  // Enhanced columns with actions
  const enhancedColumns: DataTableColumn<T>[] = React.useMemo(() => {
    const cols = [...config.columns];
    
    if (canUpdate || canDelete || config.rowActions) {
      cols.push({
        key: 'actions' as keyof T,
        header: 'Actions',
        cell: (item) => getRowActions(item),
        className: 'text-right',
      });
    }
    
    return cols;
  }, [config.columns, canUpdate, canDelete, config.rowActions]);

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{config.title}</h1>
            {config.description && (
              <p className="text-muted-foreground mt-1">{config.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {stats.length > 0 && (
              <div className="text-sm text-muted-foreground hidden md:block">
                {stats.map((stat, index) => (
                  <React.Fragment key={stat.label}>
                    {index > 0 && " | "}
                    {stat.label}: <span className="font-semibold">{stat.value}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
            {config.headerActions?.map((action, index) => {
              const Icon = action.icon;
              const hasActionPermission = !action.permission || hasPermission(action.permission);
              
              if (!hasActionPermission) return null;
              
              return (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
            {canCreate && (
              <Button onClick={handleOpenAddModal}>
                Add {config.entityName}
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={config.searchPlaceholder || `Search ${config.entityNamePlural}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {config.filters?.map((filter, index) => (
            <FilterDropdown key={index} filter={filter} />
          ))}
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredData}
              columns={enhancedColumns}
              loading={loading}
              emptyMessage={`No ${config.entityNamePlural} found.`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {config.FormComponent && (
        <config.FormComponent
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          entity={editingEntity}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntityId} onOpenChange={() => setDeletingEntityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {config.entityName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingEntityId && handleDeleteEntity(deletingEntityId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}