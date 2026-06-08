"use client"


import { Box, Button, Card, CardActionArea, CardContent, FormControl, Input, InputAdornment, InputLabel, MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { EquipmentCategories } from "../utils/equipmentCategories";
import EquipmentListEl from "./EquipmentListEl";
import ListSkeleton from "../SKELETONS/ListSkeleteon";
import { useAuth } from "../utils/authContext";
import { TEquipment } from "../utils/types";
import { Filter } from "lucide-react";

const equipmentStatuses = ["operational", "under repair", "out of service"]

const EquipmentList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    location: "all",
    status: "all",
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
      location: "all",
      status: "all"
    });
  };

  const queryParams = new URLSearchParams({
    limit: rowsPerPage.toString(),
    page: (page + 1).toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== "all")
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
    queryKey: ["equipment-list", page, rowsPerPage, filters],
    queryFn: () => 
      fetch(`/api/equipments?${queryParams}`).then(res => res.json()),
    placeholderData: keepPreviousData,
  });

  const { data: equipmentLocations, isLoading: isLoadingEquipmentLocations } = useQuery<string[]>({
    queryKey: ["/api/locations"]
  })

  const isLoading = (isLoadingEquipments || !equipments) || (isLoadingUser || !user) || (!equipmentLocations || isLoadingEquipmentLocations);

  if (isLoading) return (
    <ListSkeleton />
  )

  const rows = equipments.equips ?? [];


  return (
    <>
      {filters.category && (<h1 className="ps-1 pb-1">Equipment Category: <span className="font-semibold underline">{filters.category}</span></h1>)}
      <div className="flex gap-2 mb-3">
        {EquipmentCategories.map((c, idx) => (
          !filters.category ? (
            <Card key={idx} className="w-full flex items-center justify-center">
              <CardActionArea onClick={() => updateFilters("category", c.id)}>
                <CardContent className="text-green-600 flex justify-center items-center text-center">
                  {c.icon}
                  <p className="ms-2 text-black">{c.id}</p>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : (
            c.id === filters.category && c.types.map((t, idx) => (
              <Card key={idx} className="w-full">
                <CardActionArea
                  onClick={() => updateFilters("type", t)}
                  className="h-full"
                  sx={{backgroundColor: `${t === filters.type && "rgb(0, 190, 0)"}`}}
                >
                  <CardContent className={`text-green-600 ${t === filters.type && "text-white"}`}>
                    <p className="text-black text-sm text-center">{t}</p>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          )
        ))}
      </div>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
       <div className="flex flex-col md:flex-row gap-2 p-2">
          <div className="grow">
            <TextField size="small" fullWidth placeholder="Search Equipment" type="search" color="info" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <div className="grow flex gap-2">
            <div className="border border-black/20 text-black/60 rounded-md p-2 text-md my-auto whitespace-nowrap">
              Equipment Count: <span className="font-bold">{equipments.totalCount}</span>
            </div>
            <FormControl size="small" fullWidth>
              <Select
                color="info"
                value={filters.location}
                onChange={(e) => updateFilters("location", (e.target as HTMLInputElement).value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Filter />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Locations</MenuItem>
                {equipmentLocations.map((loc, idx) => (
                  <MenuItem key={idx} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <Select
                color="info"
                value={filters.status}
                onChange={(e) => updateFilters("status", (e.target as HTMLInputElement).value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Filter />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {equipmentStatuses.map((status, idx) => (
                  <MenuItem key={idx} value={status}>{status[0].toUpperCase()+status.slice(1).toLowerCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <Button className="text-nowrap" size="small" color="error" onClick={removeFilters}>Reset</Button>
        </div>
        <TableContainer sx={{ maxHeight: "80vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", backgroundColor: "#ececec", color: "#666", textAlign: "center" } }}>
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