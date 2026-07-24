import SlideDialog from "@/COMPONENTS/ui/SlideDialog";
import { TComponent } from "@/COMPONENTS/utils/types";
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash } from "lucide-react";
import AddEquipmentComponentForm from "./AddEquipmentComponentForm";
import DeleteEquipmentComponentForm from "./DeleteEquipmentComponentForm";

const EquipmentComponents = ({
    equipmentId,
    userRole
}: {
    equipmentId: number,
    userRole: string
}) => {

    const { data: components = [], isLoading: isLoadingComponents } = useQuery<TComponent[]>({
        queryKey: [`equipment-components`, equipmentId],
        queryFn: async () => {
            const res = await fetch(`/api/components?equipmentId=${equipmentId}`, {
                credentials: "include"
            });
            const data = await res.json()
            if (!res.ok) throw new Error(`Failed to fetch equipment components: ${data.error.message}`);

            return data;
        }
    });

    const isLoading = (isLoadingComponents);
    if (isLoading) return (<h1>Loading...</h1>)
    
    return (
        <>
            <h1>Equipment&apos;s recommended spare parts and consumables</h1>
            {userRole === "admin" && (
                <SlideDialog
                    title="Add spare components and consumables"
                    Btn={(props) => (
                        <Button {...props} size="small" color="info">
                            <Plus size={16} className="mr-2" /> Add spare components
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
                                <TableCell>Notes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {components.length > 0 ? components.map((comp, idx) => (
                                <TableRow key={comp.id} sx={{ "& .MuiTableCell-root": { textAlign: "center" } }}>
                                    { userRole !== "admin" ? (
                                        <TableCell className="border-r-2 border-gray-300">{idx+1}</TableCell>
                                    ) : (
                                        <TableCell className="group border-r-2 border-gray-300">
                                            <span className="group-hover:hidden">{idx+1}</span>
                                            <SlideDialog
                                                title="Delete Component"
                                                Btn={(props) => (
                                                    <button {...props} className="hidden group-hover:inline-flex text-red-600 hover:text-red-800 cursor-pointer">
                                                        <Trash size={16} />
                                                    </button>
                                                )}
                                                DialogForm={(props) => (
                                                    <DeleteEquipmentComponentForm {...props} componentId={comp.id} componentName={comp.name} />
                                                )}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell title={comp.name} className="max-w-32 truncate">{comp.name}</TableCell>
                                    <TableCell title={comp.manufacturer} className="max-w-32 truncate">{comp.manufacturer}</TableCell>
                                    <TableCell title={comp.partNumber} className="max-w-32 truncate">{comp.partNumber}</TableCell>
                                    <TableCell>{comp.stock}</TableCell>
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