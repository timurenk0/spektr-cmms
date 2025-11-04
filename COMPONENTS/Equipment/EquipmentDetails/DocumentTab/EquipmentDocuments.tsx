"use client"


import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Button, Tab } from '@mui/material'
import React, { useState } from 'react'
import EquipmentDocumentsEl from './EquipmentDocumentsEl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import SlideDialog from '@/COMPONENTS/ui/SlideDialog'
import EquipmentDocumentsForm from './EquipmentDocumentsForm'
import toast from 'react-hot-toast'


const EquipmentDocuments = ({ equipmentId, userRole }: { equipmentId: number, userRole: string }) => {
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState("all");

    const handleTabChange = (event: React.SyntheticEvent, val: string) => {
        setActiveTab(val);
    }


    const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<IDocument[]>({
        queryKey: [`/api/equipments/${equipmentId}/documents`],
        enabled: !!equipmentId
    });

    const deleteDocumentMutation = useMutation({
        mutationFn: async (documentId: number) => {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await response.json();
            
            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            };

            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
            queryClient.invalidateQueries({ queryKey: [`/api/equipments/${equipmentId}`] });
            toast.success("Document deleted successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
        },
        onError: (error) => {
           console.error(error.cause, error.stack);
           toast.error("Failed to delete document", {
            duration: 2000,
            position: "bottom-right",
            icon: "❌"
           });
        }
    });

    
    const isLoading = (!documents || isLoadingDocuments);

    if (isLoading) return (<h1>Loading...</h1>)
    
  return (
        <TabContext value={activeTab}>
            <div className="my-2 flex flex-col justify-between items-start">
                Manuals, certificates, maintenance records and other equipment documents
                {userRole === "admin" && (
                    <SlideDialog 
                        title="Upload Document"
                        Btn={(props) => (
                            <Button size="small" {...props} color="info" >
                                <Upload width={16} height={16} className="mr-2" /> Upload Document          
                            </Button>
                        )}
                        DialogForm={(props) => (
                            <EquipmentDocumentsForm equipmentId={equipmentId} {...props} />
                            )
                        }
                    >
                    </SlideDialog>
                )}
            </div>
            <TabList scrollButtons={false} onChange={handleTabChange} variant='scrollable'>
                <Tab label="All documents" value="all" />
                <Tab label="Manuals" value="manual" />
                <Tab label="Maintenance Reports" value="maintenance" />
                <Tab label="Certificates" value="certificate" />
                <Tab label="Pre-mob Reports" value="premob" />
                <Tab label="Fault Reports" value="fault" />
                <Tab label="Emergency Repair Reports" value="emergency" />
            </TabList>
            <TabPanel value="all">
                <EquipmentDocumentsEl documents={documents} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
            <TabPanel value="manual">
                <EquipmentDocumentsEl documents={documents.filter(doc=>doc.category==="manual")} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
            <TabPanel value="maintenance">
                <EquipmentDocumentsEl documents={documents.filter(doc=>doc.category==="maintenance")} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
            <TabPanel value="certificate">
                <EquipmentDocumentsEl documents={documents.filter(doc=>doc.category==="certificate")} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
            <TabPanel value="premob">
                <EquipmentDocumentsEl documents={documents.filter(doc=>doc.category==="premob")} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
            <TabPanel value="fault">
                <EquipmentDocumentsEl documents={documents.filter(doc=>doc.category==="fault")} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
            <TabPanel value="emergency">
                <EquipmentDocumentsEl documents={documents.filter(doc=>doc.category==="emergency")} userRole='admin' deleteDocumentMutation={deleteDocumentMutation.mutate} />
            </TabPanel>
        </TabContext>
  )
}

export default EquipmentDocuments