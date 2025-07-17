
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap } from 'lucide-react';
import PageHeader from '@/components/ui/redesign/PageHeader';
import Container from '@/components/ui/redesign/Container';

// Mock data for patient services
const mockServices = [
  {
    id: 1,
    name: 'Weight Management',
    status: 'Active',
    plan: 'GLP-1 Rx Plan',
    nextTask: 'Log your weekly weight-in',
    progress: {
      current: '185 lbs',
      change: '-15 lbs since start',
    },
    color: 'blue',
  },
  {
    id: 2,
    name: 'Hair Loss Treatment',
    status: 'Active',
    plan: 'Finasteride Plan',
    nextTask: 'Refill prescription',
    progress: {
      current: 'Month 3 of 6',
      change: 'Noticeable improvement',
    },
    color: 'purple',
  },
];

const PatientServicesPageV3 = () => {
  return (
    <Container maxWidth="4xl">
      <PageHeader
        title="My Health Services"
        subtitle="Manage your active treatment plans and track your progress."
      />
      <div className="space-y-6">
        {mockServices.map((service) => (
          <Card key={service.id} className={`border-l-4 border-${service.color}-500 overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className={`mb-2 border-${service.color}-200 text-${service.color}-700`}>{service.plan}</Badge>
                  <h3 className="text-xl font-bold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">Status: <span className={`font-semibold text-${service.color}-600`}>{service.status}</span></p>
                </div>
                <Button>Manage Plan</Button>
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Next Step</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className={`w-4 h-4 text-${service.color}-500`} />
                      <span>{service.nextTask}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Your Progress</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">{service.progress.current}</p>
                        <p className="text-xs text-muted-foreground">{service.progress.change}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
};

export default PatientServicesPageV3;
