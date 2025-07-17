
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTelehealthFlow } from "@/hooks/useTelehealthFlow.js";
import Image from "next/image";

// Mock data, in a real app this would come from a database.
const products = [
    { id: 'prod_wm', name: 'Weight Management Program', categoryId: 'weight-management', description: 'A comprehensive plan for sustainable weight loss.', price: 150, requiresPrescription: true, imageUrl: 'https://placehold.co/600x400.png', "data-ai-hint": "fitness health" },
    { id: 'prod_sh', name: 'Sexual Health Consultation', categoryId: 'sexual-health', description: 'Discreet and professional consultations.', price: 125, requiresPrescription: true, imageUrl: 'https://placehold.co/600x400.png', "data-ai-hint": "romance relationship" },
    { id: 'prod_hl', name: 'Hair Loss Treatment', categoryId: 'hair-loss', description: 'Personalized hair loss treatment plans.', price: 100, requiresPrescription: true, imageUrl: 'https://placehold.co/600x400.png', "data-ai-hint": "hair model" },
];

export default function ShopPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { initializeFlow, loading } = useTelehealthFlow();

    const handleSelectProduct = async (product: any) => {
        if (product.requiresPrescription) {
            // This is the new flow logic
            // In a real app, you would get the patientId from your auth context
            const patientId = "mock_patient_id_123"; 
            
            toast({
                title: "Initiating Telehealth Flow...",
                description: `Please wait while we set up the ${product.name}.`,
            });
            
            const result = await initializeFlow({ patientId, categoryId: product.categoryId, productId: product.id });

            if (result.success) {
                toast({
                    title: "Consultation Started",
                    description: `Redirecting to the intake process for ${product.name}.`,
                });
                // Navigate to the intake form, passing the new flow ID
                router.push(`/dashboard/intake/${result.flow.id}`);
            } else {
                toast({
                    variant: "destructive",
                    title: "Could not start consultation",
                    description: result.error?.message || "There was a problem initiating the telehealth flow. Please try again.",
                });
            }
        } else {
            // This would be the logic for non-prescription products
            toast({
                title: "Product Added to Cart",
                description: `${product.name} has been added to your cart.`,
            });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Explore Services</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <Card key={product.id}>
                        <CardHeader>
                            <div className="aspect-video relative mb-4">
                                <Image 
                                    src={product.imageUrl} 
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded-md"
                                    data-ai-hint={product['data-ai-hint']}
                                />
                            </div>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <p className="text-2xl font-bold">${product.price}</p>
                            <Button onClick={() => handleSelectProduct(product)} disabled={loading}>
                                {loading ? 'Starting...' : 'Get Started'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
