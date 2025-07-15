
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  Percent,
  CircleDollarSign
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DiscountFormModal } from "./components/discount-form-modal";
import { useToast } from "@/hooks/use-toast";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
  authDomain: "zappy-health-c1kob.firebaseapp.com",
  databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
  projectId: "zappy-health-c1kob",
  storageBucket: "zappy-health-c1kob.appspot.com",
  messagingSenderId: "833435237612",
  appId: "1:833435237612:web:53731373b2ad7568f279c9"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig, "discounts-app");
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

type Discount = {
  id: string;
  name: string;
  description: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  status: "Active" | "Inactive" | "Expired";
  validity: string;
  usage: number;
};

const FilterDropdown = ({
  label,
  options,
}: {
  label: string;
  options: string[];
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2">
        {label}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {options.map((option) => (
        <DropdownMenuItem key={option}>{option}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const StatusBadge = ({ status }: { status: Discount["status"] }) => {
    const statusMap = {
        Active: { className: "bg-green-100 text-green-800 hover:bg-green-200" },
        Inactive: { className: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
        Expired: { className: "bg-red-100 text-red-800 hover:bg-red-200" },
    };
    const currentStatus = statusMap[status] || statusMap.Inactive;

    return (
        <Badge variant="secondary" className={currentStatus.className}>
        {status}
        </Badge>
    );
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = React.useState<Discount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null);
  const { toast } = useToast();

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
        const discountsCollection = collection(db, "discounts");
        const discountsSnapshot = await getDocs(query(discountsCollection, orderBy("name", "asc")));
        const discountsList = discountsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                validity: data.validUntil ? new Date(data.validUntil.seconds * 1000).toLocaleDateString() : "No expiration"
            } as Discount;
        });
        setDiscounts(discountsList);
    } catch (error) {
        console.error("Error fetching discounts: ", error);
        toast({
            variant: "destructive",
            title: "Error fetching discounts",
            description: "Could not retrieve discount data from the database.",
        });
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDiscount(null);
  };

  const handleFormSubmit = async (values: any) => {
    // Validation logic from docs/PHASE_2A_QUICK_FIXES_COMPLETE.md
    if (!values.name || !values.code || !values.value || !values.validFrom) {
        toast({ variant: "destructive", title: "Missing required fields." });
        return;
    }
    if (values.value <= 0) {
        toast({ variant: "destructive", title: "Invalid discount value", description: "Value must be greater than 0." });
        return;
    }
    if (values.type === 'percentage' && values.value > 100) {
        toast({ variant: "destructive", title: "Invalid percentage", description: "Percentage cannot exceed 100." });
        return;
    }

    const discountData = {
        name: values.name,
        code: values.code,
        type: values.type,
        value: values.value,
        description: values.description,
        validFrom: Timestamp.fromDate(values.validFrom),
        validUntil: values.validUntil ? Timestamp.fromDate(values.validUntil) : null,
        minPurchase: values.minPurchase,
        usageLimit: values.usageLimit,
        status: values.status,
    };

    try {
        if (editingDiscount) {
            const discountDoc = doc(db, "discounts", editingDiscount.id);
            await updateDoc(discountDoc, discountData);
            toast({ title: "Discount Updated", description: `${values.name} has been saved.` });
        } else {
            await addDoc(collection(db, "discounts"), {...discountData, usage: 0});
            toast({ title: "Discount Added", description: `${values.name} has been created.` });
        }
        fetchDiscounts();
        handleCloseModal();
    } catch (error) {
        console.error("Error saving discount: ", error);
        toast({
            variant: "destructive",
            title: "Error Saving Discount",
            description: "An error occurred while saving the discount.",
        });
    }
  };

  const activeCount = discounts.filter(d => d.status === 'Active').length;
  const expiredCount = discounts.filter(d => d.status === 'Expired').length;

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discount Management</h1>
        <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
                Total: <span className="font-semibold">{discounts.length}</span> | 
                Active: <span className="font-semibold">{activeCount}</span> | 
                Expired: <span className="font-semibold">{expiredCount}</span>
            </div>
            <Button onClick={handleOpenAddModal}>
                <Plus className="mr-2 h-4 w-4" /> Add Discount
            </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search discounts by name or code..." className="pl-9" />
        </div>
        <FilterDropdown label="All Types" options={["Percentage", "Fixed Amount"]} />
        <FilterDropdown label="All Statuses" options={["Active", "Inactive", "Expired"]} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Checkbox disabled /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : discounts.length > 0 ? (
                discounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell>
                    <div className="font-medium">{discount.name}</div>
                    <div className="text-xs text-muted-foreground">{discount.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{discount.code}</Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                        {discount.type === "fixed" ? <CircleDollarSign className="h-4 w-4 text-muted-foreground" /> : <Percent className="h-4 w-4 text-muted-foreground" />}
                        <span>
                            {discount.type === "fixed" ? `$${discount.value.toFixed(2)}` : `${discount.value}%`}
                        </span>
                    </div>
                   </TableCell>
                  <TableCell>
                    <StatusBadge status={discount.status} />
                  </TableCell>
                  <TableCell>
                    <div>{discount.validity}</div>
                    {discount.validity === "No expiration" && <div className="text-xs text-muted-foreground">&nbsp;</div>}
                  </TableCell>
                  <TableCell>{discount.usage} uses</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(discount)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                        No discounts found. Click "Add Discount" to create one.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <DiscountFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        discount={editingDiscount}
    />
    </>
  );
}
