import SlideDialog from '@/COMPONENTS/ui/SlideDialog';
import { TDocument } from '@/COMPONENTS/utils/types';
import { Button } from '@mui/material';
import { format } from 'date-fns';
import { FileText, Trash } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import DeleteEquipmentDocumentForm from './DeleteEquipmentDocumentForm';


type Props = {
    documents: TDocument[],
    userRole: string,
    deleteDocumentMutation: (documentId: number) => void;
}

const EquipmentDocumentsEl = ({ documents, userRole, deleteDocumentMutation }: Props) => {   
  return documents.length > 0 ? (
    <div className="space-y-2">
        {documents.map(doc => (
            <div key={doc.id} className="flex border-b border-gray-300 last:border-0 cursor-pointer hover:bg-gray-50 py-2">
                <Link href={doc.fileUrl} target="_blank" className="flex items-center grow min-w-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                        <FileText width={20} height={20} className="text-blue-600" />
                    </div>
                    <div>
                        <div className='text-nowrap text-ellipsis overflow-hidden max-w-[200px]'>{doc.title}</div>
                        <div className="text-xs text-gray-500">{format(new Date(doc.uploadedAt), "HH:mm | MMM d, yyyy")}</div>
                    </div>
                    <div className="text-sm text-gray-500 italic ms-10 flex-1 min-w-0 truncate" title={doc.notes ? doc.notes : ""}>
                        {doc.notes}
                    </div>
                </Link>
                <div className='shrink-0 flex'>
                    <SlideDialog
                        title='Delete Document'
                        Btn={(props) => (
                            <button {...props} className='flex items-center px-3 rounded-md hover:bg-gray-100 hover:text-red-600'>
                                <Trash size={16} />
                            </button>
                        )}
                        DialogForm={(props) => (
                            <DeleteEquipmentDocumentForm {...props} documentId={doc.id} documentName={doc.title} />
                        )}
                    />
                </div>
            </div>
        ))}
    </div>
  ) : "No documents found for this category"
}

export default EquipmentDocumentsEl;