import { Skeleton } from "@mui/material"

const ListSkeleton = () => {
  return (
    <>
      <Skeleton animation="wave" variant="rectangular" width={"100%"} height={60} sx={{ borderRadius: "5px" }} />
      <Skeleton animation="wave" height={50} />
      <Skeleton animation="wave" height={50} />
      <Skeleton animation="wave" height={50} />
      <Skeleton animation="wave" height={50} />
      <Skeleton animation="wave" height={50} />
      <Skeleton animation="wave" height={50} />
    </>
  )
}

export default ListSkeleton