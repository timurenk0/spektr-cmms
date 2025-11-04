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
                containedPrimary: {
                    color: "#fff",
                    fontWeight: 500,
                }
            }
        },
        MuiTabs: {
            styleOverrides: {
                list: {
                    variants: [
                        {
                            props: { variant: "legacy" },
                            style: {
                                display: "flex",
                                justifyContent: "center",
                                background: "rgba(213, 215, 217, .4)",
                            }
                        }
                    ]
                },
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