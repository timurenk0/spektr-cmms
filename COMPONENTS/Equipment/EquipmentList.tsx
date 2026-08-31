"use client"


import { Box, Button, Card, CardActionArea, CardContent, FormControl, Input, InputAdornment, InputLabel, MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { EquipmentCategories } from "../utils/equipmentCategories";
import EquipmentListEl from "./EquipmentListEl";
import ListSkeleton from "../SKELETONS/ListSkeleteon";
import { useAuth } from "../utils/authContext";
import { TEquipment } from "../utils/types";
import { Filter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const equipmentStatuses = ["operational", "under repair", "out of service"]

const EquipmentList = () => {
  const { user, isLoading: isLoadingUser } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 0);
  const rowsPerPage = Number(searchParams.get("limit") ?? 10);

  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const category = searchParams.get("category") ?? "";
  const location = searchParams.get("location") ?? "all";
  const status = searchParams.get("status") ?? "all";

  const [searchInput, setSearchInput] = useState(search);

  const updateParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
  
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Send search input filter with debounce
  useEffect(() => {
    if (searchInput === search) return;
    
    const id = setTimeout(() => {
      updateParams({
        search: searchInput,
        page: 0
      });
    }, 500);
  
    return () => clearTimeout(id);
  }, [searchInput, search]);


  const handlePageChange = (event: unknown, newPage: number) => {
    updateParams({ page: newPage });
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParams({
      page: 0,
      limit: Number(event.target.value)
    });
  } 

  const handleLocationChange = (value: string) => {
    updateParams({
      location: value,
      page: 0
    });
  }

  const handleStatusChange = (value: string) => {
    updateParams({
      status: value,
      page: 0
    });
  }

  const handleCategoryChange = (value: string) => {
    updateParams({
      category: value,
      page: 0
    });
  }

  const handleTypeChange = (value: string) => {
    updateParams({
      type: value,
      page: 0
    });
  }

  const removeFilters = () => {
    setSearchInput("");
    updateParams({
      page: 0,
      limit: 10,
      location: "all",
      status: "all",
      category: "",
      type: ""
    });
  };


  const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{ equips: TEquipment[], totalCount: number }>({
    queryKey: ["equipment-list", searchParams.toString()],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        limit: rowsPerPage.toString(),
        page: (page+1).toString()
      });

      if (search) queryParams.set("search", search);
      if (type) queryParams.set("type", type);
      if (category) queryParams.set("category", category);
      if (location !== "all") queryParams.set("location", location);
      if (status !== "all") queryParams.set("status", status);
      
      return fetch(`/api/equipments?${queryParams.toString()}`).then(res => res.json());
    }, 
    placeholderData: keepPreviousData,
  });

  const { data: equipmentLocations, isLoading: isLoadingEquipmentLocations } = useQuery<string[]>({
    queryKey: ["/api/locations"]
  });

  const isLoading = (isLoadingEquipments || !equipments) || (isLoadingUser || !user) || (!equipmentLocations || isLoadingEquipmentLocations);

  if (isLoading) return (
    <ListSkeleton />
  )

  const rows = equipments.equips ?? [];


  return (
    <>
      {category && (<h1 className="ps-1 pb-1">Equipment Category: <span className="font-semibold underline">{category}</span></h1>)}

      <div className="">
        <div className="flex gap-2 my-2">
          {EquipmentCategories.map((c, idx) => (
            !category ? (
              <Card key={idx} className="w-full flex items-center justify-center">
                <CardActionArea onClick={() => handleCategoryChange(c.id)}>
                  <CardContent className="text-green-600 flex justify-center items-center text-center">
                    {c.icon}
                    <p className="ms-2 text-black">{c.id}</p>
                  </CardContent>
                </CardActionArea>
              </Card>
            ) : (
              c.id === category && c.types.map((t, idx) => (
                <Card key={idx} className="w-full">
                  <CardActionArea
                    onClick={() => handleTypeChange(t)}
                    className="h-full"
                    sx={{backgroundColor: `${t === type && "rgb(0, 190, 0)"}`}}
                  >
                    <CardContent className={`text-green-600 ${t === type && "text-white"}`}>
                      <p className="text-black text-sm text-center">{t}</p>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))
            )
          ))}
          </div>
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
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
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
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
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
        </div>
      <Paper sx={{ width: "100%", overflowX: "hidden" }}>
        <TableContainer sx={{ maxHeight: "80vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ "& .MuiTableCell-root": { padding: "0.25rem", fontWeight: "bold", backgroundColor: "#ececec", color: "#666", textAlign: "center" } }}>
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
                <EquipmentListEl key={idx} equipment={equipment} user={user} searchParams={searchParams.toString()} />
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
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Paper>
    </>
  )
}

export default EquipmentList;