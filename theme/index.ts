import { createTheme } from "@mui/material";
import type {} from "@mui/lab/themeAugmentation";

const theme = createTheme({
    palette: {
        primary: {
            main: "#26b43e",
            contrastText: "#fff"
        }
    },
    components: {
        MuiButton: {
            defaultProps: {
                variant: "contained",
                color: "primary",
            },
            styleOverrides: {
                contained: {
                    color: "#fff",
                    fontWeight: 500,
                }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    variants: [
                        {
                            props: { variant: "legacy" },
                            style: {
                                margin: "8px 16px",
                                borderRadius: "8px",
                                width: "100%",
                                "&.Mui-selected": {
                                    backgroundColor: "white",
                                    color: "black"
                                }
                            }
                        }
                    ]
                },
            }
        }
    }
});


export default theme;