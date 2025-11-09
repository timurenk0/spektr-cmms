"use client"


import { Button, Card, CardActionArea, CardContent, FormControl, InputLabel, MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EquipmentTypes } from "../utils/equipmentTypes";
import EquipmentListEl from "./EquipmentListEl";
import ListSkeleton from "../SKELETONS/ListSkeleteon";
import { useAuth } from "../utils/authContext";

const EquipmentList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { user, isLoading: isLoadingUser } = useAuth();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const hanldePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }


  const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{ equips: IEquipment[], totalCount: number }>({
    queryKey: [`/api/equipments?limit=${rowsPerPage}&page=${page+1}`]
  });

  const isLoading = (isLoadingEquipments || !equipments) || (isLoadingUser || !user);

  if (isLoading) return (
    <ListSkeleton />
  )


  const filteredEquipments = equipments.equips.filter(eq => {
    const matchSearch = searchQuery === "" ? true :
      ( eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    const matchType = typeFilter === "" ? true : eq.type === typeFilter;
    const matchCategory = categoryFilter === "" ? true : eq.category === categoryFilter;
    const matchLocation = locationFilter === "" ? true : eq.location === locationFilter;
    const matchStatus = statusFilter === "" ? true : eq.status === statusFilter;


    return (matchSearch && matchType && matchCategory && matchLocation && matchStatus);
  });


  console.log(filteredEquipments);

  const equipmentLocations = [...(new Set(filteredEquipments.map(eq => eq.location)))];
  const equipmentStatuses = [...(new Set(filteredEquipments.map(eq => eq.status)))];

  const removeFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setCategoryFilter("");
    setLocationFilter("");
    setStatusFilter("");
  }
  
  return (
    <>
      {typeFilter && (<h1 className="ps-1 pb-1">Equipment Type: <span className="font-semibold underline">{typeFilter}</span></h1>)}
      <div className="flex gap-2 mb-3">
        {EquipmentTypes.map(type => (
          !typeFilter ? (
            <Card key={type.id} className="w-full">
              <CardActionArea onClick={() => setTypeFilter(type.id)}>
                <CardContent className="text-green-600 flex justify-center">
                  {type.icon}
                  <p className="ms-2">{type.id}</p>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : (
            type.id === typeFilter && type.categories.map(category => (
              <Card key={category} className={`w-full ${categoryFilter && "bg-green-500 text-white"}`}>
                <CardActionArea
                  onClick={() => setCategoryFilter(category)}
                  className="h-full"
                  sx={category === categoryFilter && {
                    backgroundColor: "rgb(0, 160, 0)"
                  }}
                >
                  <CardContent className={`text-green-600 ${category === categoryFilter && "text-white"}`}>
                    {category}
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          )
        ))}
      </div>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 p-2 gap-2">
          <TextField size="small" label="Search Equipment" type="search" className="col-span-2" color="info" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="flex gap-2">
            <FormControl size="small" fullWidth>
              <InputLabel id="location-filter" color="info">Select Location</InputLabel>
              <Select labelId="location-filter" label="Select Location" color="info" value={locationFilter} onChange={(e) => setLocationFilter((e.target as HTMLInputElement).value)}>
                {equipmentLocations.map(loc => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter" color="info">Select Status</InputLabel>
              <Select labelId="status-filter" label="Select Status" color="info" value={statusFilter} onChange={(e) => setStatusFilter((e.target as HTMLInputElement).value)}>
                {equipmentStatuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button className="w-full text-nowrap" sx={{ fontSize: "12px" }} onClick={removeFilters}>Remove Filters</Button>
          </div>
        </div>
        <TableContainer sx={{ maxHeight: "80vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", textAlign: "center" } }}>
                <TableCell>Equipment</TableCell>
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
              {filteredEquipments.map((equipment: IEquipment, idx: number) => (
                <EquipmentListEl key={idx} equipment={equipment} userRole={user.role} />
              ))}            
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={equipments.totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={hanldePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </>
  )
}

export default EquipmentList;