// import Drawer from "@mui/material/Drawer"
// import Toolbar from "@mui/material/Toolbar"
// import List from "@mui/material/List"
// import ListItemButton from "@mui/material/ListItemButton"
// import WorkspacesIcon from "./assets/EmployeesIcon.svg?react"
// import OfficeIcon from "./assets/OfficeIcon.svg?react"
// import SearchIcon from "./assets/SearchIcon.svg?react"
// import ImortExportIcon from "./assets/ImportExportIcon.svg?react"
// import { useNavigate } from "react-router-dom"
// import { drawerWidth } from "@features/OfficesBar/config/config"

// const iconSize = drawerWidth / 2

// function NavBar({ onToggleOffices }: { onToggleOffices: () => void }) {
//   const nav = useNavigate()
//   return (
//     <Drawer
//       variant="permanent"
//       anchor="left"
//       sx={{
//         width: drawerWidth,
//         flexShrink: 0,
//         "& .MuiDrawer-paper": {
//           width: drawerWidth,
//           boxSizing: "border-box",
//           display: "flex",
//           flexDirection: "column",
//         },
//       }}
//     >
//       <Toolbar />
//       <List>
//         {/* <ListItemButton sx={{ mb: "10px" }}>
//           <SearchIcon width={iconSize} height={iconSize} />
//         </ListItemButton> */}
//         <ListItemButton onClick={onToggleOffices}>
//           <OfficeIcon width={iconSize} height={iconSize} />
//         </ListItemButton>
//       </List>
//       <List sx={{ mt: "auto", mb: "20px" }}>
//         <ListItemButton sx={{ mb: "10px" }}onClick={()=> nav('/adminpanel')}>
//           <WorkspacesIcon width={iconSize} height={iconSize} />
//         </ListItemButton>
//         {/* <ListItemButton >
//           <ImortExportIcon width={iconSize} height={iconSize} />
//         </ListItemButton> */}
//       </List>
//     </Drawer>
//   )
// }

// export default NavBar

import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { drawerWidth } from "@features/OfficesBar/config/config";
import OfficeIcon from "./assets/OfficeIcon.svg?react";
import WorkspacesIcon from "./assets/EmployeesIcon.svg?react";
import MapIcon from "@mui/icons-material/Map"; // или свой SVG
import { $user } from "@shared/store/auth";
import { useUnit } from "effector-react";

interface NavBarProps {
  onToggleOffices: () => void;
}

const iconSize = 28;

function NavBar({ onToggleOffices }: NavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMapActive =
    location.pathname === "/" || location.pathname.includes("map");

  const user = useUnit($user);

  const canEdit = user?.role === "ADMIN";
  const canBook = user?.role === "USER";
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#f8f9fa",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      <Toolbar /> {/* отступ под шапку */}
      <List sx={{ pt: 2 }}>
        {/* Мои офисы */}
        <Tooltip title="Мои офисы" placement="right" arrow>
          <ListItemButton
            onClick={onToggleOffices}
            sx={{
              mb: 1,
              justifyContent: "center",
              borderRadius: "8px",
              mx: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto" }}>
              <OfficeIcon width={iconSize} height={iconSize} />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>

        {/* Карта офиса — активный пункт */}
        <Tooltip title="Карта офиса" placement="right" arrow>
          <ListItemButton
            selected={isMapActive}
            sx={{
              mb: 1,
              justifyContent: "center",
              borderRadius: "8px",
              mx: 1,
              "&.Mui-selected": {
                backgroundColor: "#e3f2fd",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto" }}>
              <MapIcon
                sx={{
                  fontSize: iconSize + 4,
                  color: isMapActive ? "#1976d2" : "#666",
                }}
              />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </List>
      {/* Нижняя часть */}
      <List sx={{ mt: "auto", mb: 3 }}>
        {canEdit && (
          <Tooltip title="Админ панель" placement="right" arrow>
            <ListItemButton
              onClick={() => navigate("/adminpanel")}
              sx={{
                justifyContent: "center",
                borderRadius: "8px",
                mx: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto" }}>
                <WorkspacesIcon width={iconSize} height={iconSize} />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        )}
      </List>
    </Drawer>
  );
}

export default NavBar;
