import SlideDialog from "@/COMPONENTS/ui/SlideDialog";
import { TComponent } from "@/COMPONENTS/utils/types";
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import AddEquipmentComponentForm from "./AddEquipmentComponentForm";

const EquipmentComponents = ({
    equipmentId,
    userRole
}: {
    equipmentId: number,
    userRole: string
}) => {

    const { data: components = [], isLoading: isLoadingComponents } = useQuery<TComponent[]>({
        queryKey: [`/api/components`, equipmentId]
    });

    const isLoading = (isLoadingComponents);
    if (isLoading) return (<h1>Loading...</h1>)
    
    return (
        <>
            <h1>Equipment's critical components and consumables</h1>
            {userRole === "admin" && (
                <SlideDialog
                    title="Add critical components and consumables"
                    Btn={(props) => (
                        <Button {...props} size="small" color="info">
                            <Plus size={16} className="mr-2" /> Add critical components
                        </Button>
                    )}
                    DialogForm={(props) => (
                        <AddEquipmentComponentForm {...props} equipmentId={equipmentId} />
                    )}
                />
            )}
            <Paper sx={{ width: "100%", overflow: "hidden", marginTop: "1rem" }}>
                <TableContainer sx={{ maxHeight: "80vh" }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", backgroundColor: "#ececec", color: "#666", textAlign: "center" } }}>
                                <TableCell className="border-r-2 border-gray-300">#</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Manufacture</TableCell>
                                <TableCell>Part Number</TableCell>
                                <TableCell>Recommended Stock</TableCell>
                                <TableCell>Fail Impact</TableCell>
                                <TableCell>Notes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {components.length > 0 ? components.map((comp, idx) => (
                                <TableRow sx={{ "& .MuiTableCell-root": { textAlign: "center" } }}>
                                    <TableCell className="border-r-2 border-gray-300">{idx+1}</TableCell>
                                    <TableCell>{comp.name}</TableCell>
                                    <TableCell>{comp.manufacturer}</TableCell>
                                    <TableCell>{comp.partNumber}</TableCell>
                                    <TableCell>{comp.stock}</TableCell>
                                    <TableCell>{comp.failImpact}</TableCell>
                                    <TableCell className="max-w-20 truncate" title={comp.notes || "No notes"}>{comp.notes?.length ? comp.notes : ""}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="italic">No critical components or consumables yet...</div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    )
}


export default EquipmentComponents;