"use client"


import { Button, Card, CardActionArea, CardContent, FormControl, Input, InputLabel, MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { EquipmentTypes } from "../utils/equipmentTypes";
import EquipmentListEl from "./EquipmentListEl";
import ListSkeleton from "../SKELETONS/ListSkeleteon";
import { useAuth } from "../utils/authContext";
import { TEquipment } from "../utils/types";

const equipmentStatuses = ["operational", "under repair", "out of service"]

const EquipmentList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    location: "",
    status: "",
  });
  const [searchInput, setSearchInput] = useState("");

  // Send search input filter with debounce
  useEffect(() => {
    const id = setTimeout(() => {
      updateFilters("search", searchInput);
    }, 500);
  
    return () => clearTimeout(id);
  }, [searchInput]);

  const { user, isLoading: isLoadingUser } = useAuth();


  const updateFilters = <K extends keyof typeof filters>(key: K, value: string) => {
    setPage(0);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilters = () => {
    setPage(0);
    setSearchInput("");
    setFilters({
      search: "",
      type: "",
      category: "",
      location: "",
      status: ""
    });
  };

  const queryParams = new URLSearchParams({
    limit: rowsPerPage.toString(),
    page: (page + 1).toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "")
    )
  }).toString();

  const hanldePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }


  const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{ equips: TEquipment[], totalCount: number }>({
    queryKey: ["/api/equipments", page, rowsPerPage, filters],
    queryFn: () => 
      fetch(`/api/equipments?${queryParams}`).then(res => res.json()),
    placeholderData: keepPreviousData
  });

  const { data: equipmentLocations, isLoading: isLoadingEquipmentLocations } = useQuery<string[]>({
    queryKey: ["/api/locations"]
  })

  const isLoading = (isLoadingEquipments || !equipments) || (isLoadingUser || !user) || (!equipmentLocations || isLoadingEquipmentLocations);

  if (isLoading) return (
    <ListSkeleton />
  )

  const rows = equipments?.equips ?? [];


  return (
    <>
      {filters.type && (<h1 className="ps-1 pb-1">Equipment Type: <span className="font-semibold underline">{filters.type}</span></h1>)}
      <div className="flex gap-2 mb-3">
        {EquipmentTypes.map(type => (
          !filters.type ? (
            <Card key={type.id} className="w-full">
              <CardActionArea onClick={() => updateFilters("type", type.id)}>
                <CardContent className="text-green-600 flex justify-center">
                  {type.icon}
                  <p className="ms-2 text-black">{type.id}</p>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : (
            type.id === filters.type && type.categories.map(category => (
              <Card key={category} className="w-full">
                <CardActionArea
                  onClick={() => updateFilters("category", category)}
                  className="h-full"
                  sx={category === filters.category && {
                    backgroundColor: "rgb(0, 190, 0)",
                  }}
                >
                  <CardContent className={`text-green-600 ${category === filters.category && "text-white"}`}>
                    <p className="text-black text-sm text-center">{category}</p>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          )
        ))}
      </div>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
       <div className="grid grid-cols-1 md:grid-cols-4 p-2 gap-1">
          <TextField size="small" className="col-span-2" placeholder="Search Equipment" type="search" color="info" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <div className="flex gap-2 col-span-2">
            <FormControl size="small" fullWidth>
              <InputLabel id="location-filter" color="info">Select Location</InputLabel>
              <Select labelId="location-filter" label="Select Location" color="info" value={filters.location} onChange={(e) => updateFilters("location", (e.target as HTMLInputElement).value)}>
                {equipmentLocations.map(loc => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter" color="info">Select Status</InputLabel>
              <Select labelId="status-filter" label="Select Status" color="info" value={filters.status} onChange={(e) => updateFilters("status", (e.target as HTMLInputElement).value)}>
                {equipmentStatuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button className="text-nowrap" size="small" color="error" onClick={removeFilters}>Reset</Button>
          </div>
        </div>
        <TableContainer sx={{ maxHeight: "80vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", backgroundColor: "#ececec", color: "#666", textAlign: "center" } }}>
                <TableCell>Equipment ({ equipments.totalCount })</TableCell>
                <TableCell>Asset ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Last Maintenance</TableCell>
                <TableCell>Next Maintenance</TableCell>
                <TableCell>Health Score</TableCell>
                {user.role==="admin" && (
                  <TableCell>Admin</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length > 0 ? rows.map((equipment, idx) => (
                <EquipmentListEl key={idx} equipment={equipment} userRole={user.role} />
              )): (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="italic">No equipment records found...</div>
                  </TableCell>
                </TableRow>
              )}            
            </TableBody>
          </Table>
        </TableContainer>
        {rows.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={equipments.totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={hanldePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Paper>
    </>
  )
}

export default EquipmentList;