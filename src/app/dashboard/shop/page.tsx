
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTelehealthFlow } from "@/hooks/useTelehealthFlow.js";
import { prescriptionOrchestrator } from "@/services/prescriptionOrchestrator";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    requiresPrescription: boolean;
    productType: string;
    controlledSchedule?: string;
    imageUrl: string;
    'data-ai-hint'?: string;
}

export default function ShopPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { initializeFlow, loading: telehealthLoading } = useTelehealthFlow();
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Load products from Firebase
    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                if (db) {
                    const productsQuery = query(
                        collection(db, "products"),
                        where("isActive", "==", true)
                    );
                    const snapshot = await getDocs(productsQuery);
                    const productsList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Product));
                    setProducts(productsList);
                } else {
                    throw new Error("Database not initialized");
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                // Fallback to mock data if Firebase fails
                setProducts([
                    { id: 'prod_wm', name: 'Weight Management Program', category: 'Weight Management', description: 'A comprehensive plan for sustainable weight loss.', price: 150, requiresPrescription: true, productType: 'prescription', imageUrl: 'https://placehold.co/600x400.png', "data-ai-hint": "fitness health" },
                    { id: 'prod_sh', name: 'Sexual Health Consultation', category: 'ED', description: 'Discreet and professional consultations.', price: 125, requiresPrescription: true, productType: 'prescription', imageUrl: 'https://placehold.co/600x400.png', "data-ai-hint": "romance relationship" },
                    { id: 'prod_hl', name: 'Hair Loss Treatment', category: 'Hair', description: 'Personalized hair loss treatment plans.', price: 100, requiresPrescription: true, productType: 'prescription', imageUrl: 'https://placehold.co/600x400.png', "data-ai-hint": "hair model" },
                ] as Product[]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleSelectProduct = async (product: any) => {
        try {
            setLoading(true);
            
            // Use prescription orchestrator to route product appropriately
            const routingResult = await prescriptionOrchestrator.routeProductOrder(
                product.id,
                'current-patient-id', // This should come from auth context
                null // Provider data if available
            );

            if (routingResult.success) {
                if (routingResult.workflow === 'direct') {
                    // Direct OTC order - redirect to payment
                    toast({
                        title: "Product Added to Cart",
                        description: `${product.name} has been added to your cart.`,
                    });
                    router.push(`/dashboard/checkout/${routingResult.orderId}`);
                } else if (routingResult.workflow === 'prescription') {
                    // Prescription required - start telehealth flow
                    const telehealthResult = await initializeFlow({
                        patientId: 'current-patient-id',
                        productId: product.id,
                        categoryId: product.category
                    });
                    
                    if (telehealthResult.success && (telehealthResult as any).flow?.id) {
                        toast({
                            title: "Consultation Started",
                            description: `Redirecting to the intake process for ${product.name}.`,
                        });
                        router.push(`/dashboard/intake/${(telehealthResult as any).flow.id}`);
                    } else {
                        throw new Error("Could not start consultation");
                    }
                }
            } else {
                throw new Error("Could not process product order");
            }
        } catch (error) {
            console.error('Error selecting product:', error);
            toast({
                variant: "destructive",
                title: "Could not process selection",
                description: "There was a problem processing your selection. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const getProductTypeDisplay = (product: any) => {
        if (product.productType === 'controlled') {
            return (
                <div className="flex gap-2 mb-2">
                    <Badge variant="destructive">Controlled Substance</Badge>
                    {product.controlledSchedule && (
                        <Badge variant="outline">{product.controlledSchedule}</Badge>
                    )}
                </div>
            );
        } else if (product.requiresPrescription || product.productType === 'prescription') {
            return <Badge variant="secondary" className="mb-2">Prescription Required</Badge>;
        } else {
            return <Badge variant="default" className="mb-2">Over-the-Counter</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-bold">Explore Services</h1>
                <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Explore Services</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <Card key={product.id}>
                        <CardHeader>
                            <div className="aspect-video relative mb-4">
                                <Image
                                    src={product.imageUrl || 'https://placehold.co/600x400.png'}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded-md"
                                    data-ai-hint={product['data-ai-hint']}
                                />
                            </div>
                            {getProductTypeDisplay(product)}
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <p className="text-2xl font-bold">${product.price}</p>
                            <Button onClick={() => handleSelectProduct(product)} disabled={loading || telehealthLoading}>
                                {(loading || telehealthLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Get Started'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
