import LogoutIcon from "@mui/icons-material/Logout";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@shared/store/auth";

type HeaderProps = {
  officeName: string | undefined;
};

const roleLabelMap = {
  USER: "Пользователь",
  ADMIN: "Администратор",
  SUPER_ADMIN: "Супер-администратор",
} as const;

export default function Header({ officeName }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const title = officeName ? `Офис: "${officeName}"` : "";
  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || "U";
  const userLabel = user?.name || user?.email || "Пользователь";
  const roleLabel = user?.role ? roleLabelMap[user.role] : "Гость";

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/auth");
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-[#2F80ED] h-[60px] z-[2000]">
      <div className="flex items-center justify-between h-full px-10">
        <div className="w-1/3 flex items-center h-full px-10 gap-4">
          <button
            type="button"
            className="text-white cursor-pointer hover:text-gray-200 transition-colors"
            onClick={() => setShowUserMenu(true)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#2F80ED] font-bold text-sm">
                  {userInitial}
                </span>
              </div>
              <span className="text-sm font-medium">{userLabel}</span>
            </div>
          </button>

          <span className="text-sm font-medium text-white select-none">
            {roleLabel}
          </span>
        </div>

        <div className="w-1/3 flex justify-center select-none">
          <p className="font-bold text-white text-3xl tracking-wide drop-shadow-lg">
            {title}
          </p>
        </div>

        <div className="w-1/3 flex justify-end items-center gap-4 pr-8">
          <p
            className="font-bold text-white text-3xl cursor-pointer flex items-center gap-2 transition-colors"
            onClick={() => navigate("/")}
          >
            Office Map
          </p>
        </div>
      </div>

      <Dialog
        open={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Профиль</DialogTitle>
        <DialogContent dividers>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "#2F80ED" }}>{userInitial}</Avatar>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">{userLabel}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || "Email не указан"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Роль: {roleLabel}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowUserMenu(false)}>Закрыть</Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  );
}
