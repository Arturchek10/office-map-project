import Header from '@entities/Header/Header';
import NavBar from '@entities/NavBar/NavBar';
import { drawerWidth } from '@features/OfficesBar/config/config';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RestoreIcon from '@mui/icons-material/Restore';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  approveAdminRequest,
  blockAdminWithOffices,
  blockUser,
  createAdmin,
  createAdminRequest,
  getAdminOffices,
  getAdminRequests,
  getBannedUsers,
  getMyAdminOffices,
  getMyAdminRequests,
  getOfficeBookingsByAdmin,
  getUserBookingsByAdmin,
  getUsers,
  rejectAdminRequest,
  unblockAdminWithOffices,
  unblockUser,
} from '@shared/api/Admin';
import type { Booking } from '@shared/api/Bookings';
import { $user } from '@shared/store/auth';
import type {
  AdminOffice,
  AdminRequest,
  UserListItem,
} from '@shared/types/admin';
import type { UserInfo } from '@shared/types/user.types';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type SuperTab = 'requests' | 'users' | 'banned' | 'create';
type ReportTab = 'places' | 'floors' | 'office';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);

const buildOfficeReport = (bookings: Booking[]) => {
  const placeMap = new Map<
    string,
    { label: string; floor: string; count: number; revenue: number }
  >();
  const floorMap = new Map<
    string,
    { floor: string; count: number; revenue: number; markers: Set<string> }
  >();

  let totalRevenue = 0;
  let totalHours = 0;

  bookings.forEach((booking) => {
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    const durationHours = (end - start) / (1000 * 60 * 60);
    totalHours += Number.isFinite(durationHours) ? durationHours : 0;

    const totalPrice = Number(booking.totalPrice ?? 0);
    const pricePerHour = Number(
      booking.pricePerHour ?? booking.place.marker.pricePerHour ?? 0,
    );
    const fallbackPrice = pricePerHour * Math.max(0, durationHours);
    const revenue = totalPrice || fallbackPrice;
    totalRevenue += revenue;

    const placeLabel =
      booking.place.marker.name || `Место #${booking.markerId}`;
    const floorLabel = `${booking.place.floorName} (этаж ${booking.place.floorOrderNumber})`;

    const key = `${booking.place.floorId}:${booking.markerId}`;
    const placeEntry = placeMap.get(key) ?? {
      label: placeLabel,
      floor: floorLabel,
      count: 0,
      revenue: 0,
    };
    placeEntry.count += 1;
    placeEntry.revenue += revenue;
    placeMap.set(key, placeEntry);

    const floorKey = String(booking.place.floorId);
    const floorEntry = floorMap.get(floorKey) ?? {
      floor: floorLabel,
      count: 0,
      revenue: 0,
      markers: new Set<string>(),
    };
    floorEntry.count += 1;
    floorEntry.revenue += revenue;
    floorEntry.markers.add(placeLabel);
    floorMap.set(floorKey, floorEntry);
  });

  return {
    totalBookings: bookings.length,
    totalRevenue,
    totalHours,
    uniquePlaces: placeMap.size,
    uniqueFloors: floorMap.size,
    placeRows: Array.from(placeMap.values()).sort((a, b) => b.count - a.count),
    floorRows: Array.from(floorMap.values()).sort((a, b) => b.count - a.count),
  };
};

export default function AdminPanelPage() {
  const user = useUnit($user);

  return (
    <>
      <Header officeName="Панель управления" />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f7fb' }}>
        <NavBar onToggleOffices={() => undefined} />
        <Box
          component="main"
          sx={{
            ml: `${drawerWidth}px`,
            pt: '88px',
            px: 4,
            pb: 4,
            width: '100%',
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          {user?.role === 'USER' && <AdminRequestSection user={user} />}
          {user?.role === 'ADMIN' && <AdminOfficesSection />}
          {user?.role === 'SUPER_ADMIN' && <SuperAdminSection />}
          {!user?.role && (
            <Alert severity="warning">Роль пользователя не найдена.</Alert>
          )}
        </Box>
      </Box>
    </>
  );
}

function AdminRequestSection({ user }: { user: UserInfo }) {
  const [email, setEmail] = useState(user.email ?? '');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pendingRequest = requests.find(
    (request) => request.status === 'PENDING',
  );
  const phoneIsValid =
    !phone.trim() || /^\+?[0-9][0-9\s\-()]{6,24}$/.test(phone.trim());

  const loadRequests = async () => {
    try {
      setRequests(await getMyAdminRequests());
    } catch (err) {
      setError(messageFromError(err, 'Не удалось загрузить ваши заявки'));
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const submit = async () => {
    if (!phoneIsValid) {
      setError(
        'Телефон должен содержать только цифры, пробелы, скобки, дефис и опциональный плюс в начале',
      );
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createAdminRequest({ email, phone, comment });
      await loadRequests();
      setMessage('Заявка отправлена. Супер-админ увидит её в панели.');
    } catch (err) {
      setError(messageFromError(err, 'Не удалось отправить заявку'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 1, maxWidth: 720 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Запросить статус администратора
        </Typography>
        <TextField
          label="Email для связи"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={!phoneIsValid}
          helperText={
            phoneIsValid
              ? 'Например: +7 999 000-00-00'
              : 'Телефон должен содержать только цифры и символы + - ( )'
          }
        />
        <TextField
          label="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          minRows={4}
          multiline
        />
        {pendingRequest && (
          <Alert severity="info">
            У вас уже есть активная заявка. Новую можно будет отправить после
            отклонения текущей.
          </Alert>
        )}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={submit}
          disabled={
            loading || !email.trim() || !phoneIsValid || Boolean(pendingRequest)
          }
          sx={{ alignSelf: 'flex-start' }}
        >
          Отправить заявку
        </Button>
      </Stack>
    </Paper>
  );
}

function AdminOfficesSection() {
  const [offices, setOffices] = useState<AdminOffice[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsTitle, setBookingsTitle] = useState('');
  const [reports, setReports] = useState<Booking[]>([]);
  const [reportsTitle, setReportsTitle] = useState('');

  const loadOffices = async (nextCursor: number | null = null) => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyAdminOffices({ cursor: nextCursor, size: 20 });
      setOffices((prev) =>
        nextCursor ? [...prev, ...data.items] : data.items,
      );
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(messageFromError(err, 'Не удалось загрузить офисы'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOffices();
  }, []);

  const openOfficeBookings = async (office: AdminOffice) => {
    setBookingsTitle(office.name ?? `Офис #${office.id}`);
    setBookings(await getOfficeBookingsByAdmin(office.id));
  };

  const openOfficeReports = async (office: AdminOffice) => {
    setReportsTitle(office.name ?? `Офис #${office.id}`);
    setReports(await getOfficeBookingsByAdmin(office.id));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Мои офисы и аренды
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={1}>
        {offices.map((office) => (
          <Paper key={office.id} sx={{ p: 2, borderRadius: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Typography fontWeight={700}>
                  {office.name ?? `Офис #${office.id}`}
                </Typography>
                <Typography color="text.secondary">
                  {office.address ?? 'Адрес не указан'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Этажей: {office.floorsCount}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  onClick={() => void openOfficeBookings(office)}
                >
                  Аренды офиса
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void openOfficeReports(office)}
                >
                  Отчёты
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
      {loading && <CircularProgress />}
      {hasMore && (
        <Button
          variant="outlined"
          onClick={() => void loadOffices(cursor)}
          disabled={loading}
        >
          Загрузить ещё
        </Button>
      )}
      <BookingsDialog
        title={bookingsTitle}
        bookings={bookings}
        onClose={() => {
          setBookings([]);
          setBookingsTitle('');
        }}
      />
      <ReportsDialog
        title={reportsTitle}
        bookings={reports}
        onClose={() => {
          setReports([]);
          setReportsTitle('');
        }}
      />
    </Stack>
  );
}

function SuperAdminSection() {
  const [tab, setTab] = useState<SuperTab>('requests');

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Супер-админ
      </Typography>
      <Paper sx={{ borderRadius: 1 }}>
        <Tabs value={tab} onChange={(_, value: SuperTab) => setTab(value)}>
          <Tab value="requests" label="Заявки" />
          <Tab value="users" label="Пользователи" />
          <Tab value="banned" label="Заблокированные" />
          <Tab value="create" label="Создать админа" />
        </Tabs>
      </Paper>
      {tab === 'requests' && <RequestsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'banned' && <BannedUsersTab />}
      {tab === 'create' && <CreateAdminTab />}
    </Stack>
  );
}

function RequestsTab() {
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (nextCursor: number | null = null) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminRequests({
        email,
        cursor: nextCursor,
        size: 20,
      });
      setItems((prev) => (nextCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(messageFromError(err, 'Не удалось загрузить заявки'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [email]);

  const afterAction = async () => load();

  return (
    <ListShell
      search={email}
      setSearch={setEmail}
      error={error}
      loading={loading}
      hasMore={hasMore}
      onMore={() => void load(cursor)}
    >
      {items.map((request) => (
        <Paper key={request.id} sx={{ p: 2, borderRadius: 1 }}>
          <Stack direction="row" justifyContent="space-between" gap={2}>
            <Box>
              <Typography fontWeight={700}>{request.email}</Typography>
              <Typography color="text.secondary">
                {request.phone ?? 'Телефон не указан'} ·{' '}
                {formatDateTime(request.createdAt)}
              </Typography>
              {request.comment && (
                <Typography sx={{ mt: 1 }}>{request.comment}</Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={request.status} />
              {request.status === 'PENDING' && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={async () => {
                      await approveAdminRequest(request.id);
                      await afterAction();
                    }}
                  >
                    Одобрить
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      await rejectAdminRequest(
                        request.id,
                        'Отклонено супер-админом',
                      );
                      await afterAction();
                    }}
                  >
                    Отклонить
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Paper>
      ))}
    </ListShell>
  );
}

function UsersTab() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserInfo['role'] | ''>('');
  const [items, setItems] = useState<UserListItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsTitle, setBookingsTitle] = useState('');
  const [offices, setOffices] = useState<AdminOffice[]>([]);
  const [confirmBlock, setConfirmBlock] = useState<UserListItem | null>(null);

  const load = async (nextCursor: number | null = null) => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers({
        email,
        role: role || undefined,
        cursor: nextCursor,
        size: 20,
      });
      setItems((prev) => (nextCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(messageFromError(err, 'Не удалось загрузить пользователей'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [email, role]);

  const openBookings = async (item: UserListItem) => {
    setBookingsTitle(item.email);
    setBookings(await getUserBookingsByAdmin(item.id));
  };

  const openOffices = async (item: UserListItem) => {
    const data = await getAdminOffices({ adminId: item.id, size: 50 });
    setOffices(data.items);
  };

  return (
    <>
      <ListShell
        search={email}
        setSearch={setEmail}
        error={error}
        loading={loading}
        hasMore={hasMore}
        onMore={() => void load(cursor)}
        extraFilters={
          <TextField
            select
            label="Роль"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as UserInfo['role'] | '')
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="USER">USER</MenuItem>
            <MenuItem value="ADMIN">ADMIN</MenuItem>
            <MenuItem value="SUPER_ADMIN">SUPER_ADMIN</MenuItem>
          </TextField>
        }
      >
        {items.map((item) => (
          <UserRow
            key={item.id}
            item={item}
            onRefresh={() => void load()}
            onBookings={() => void openBookings(item)}
            onOffices={
              item.role === 'ADMIN' ? () => void openOffices(item) : undefined
            }
            onDanger={
              item.role === 'ADMIN' ? () => setConfirmBlock(item) : undefined
            }
          />
        ))}
      </ListShell>
      <BookingsDialog
        title={bookingsTitle}
        bookings={bookings}
        onClose={() => {
          setBookings([]);
          setBookingsTitle('');
        }}
      />
      <OfficesDialog offices={offices} onClose={() => setOffices([])} />
      <ConfirmBlockDialog
        user={confirmBlock}
        onClose={() => setConfirmBlock(null)}
        onConfirm={async (reason) => {
          if (!confirmBlock) return;
          await blockAdminWithOffices(confirmBlock.id, reason);
          setConfirmBlock(null);
          await load();
        }}
      />
    </>
  );
}

function BannedUsersTab() {
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<UserListItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (nextCursor: number | null = null) => {
    setLoading(true);
    setError('');
    try {
      const data = await getBannedUsers({
        email,
        cursor: nextCursor,
        size: 20,
      });
      setItems((prev) => (nextCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(messageFromError(err, 'Не удалось загрузить заблокированных'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [email]);

  return (
    <ListShell
      search={email}
      setSearch={setEmail}
      error={error}
      loading={loading}
      hasMore={hasMore}
      onMore={() => void load(cursor)}
    >
      {items.map((item) => (
        <UserRow key={item.id} item={item} onRefresh={() => void load()} />
      ))}
    </ListShell>
  );
}

function CreateAdminTab() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('string123');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await createAdmin({ email, name, password });
      setMessage('Админ создан.');
      setEmail('');
      setName('');
      setPassword('string123');
    } catch (err) {
      setError(messageFromError(err, 'Не удалось создать админа'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 1, maxWidth: 720 }}>
      <Stack spacing={2}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={submit}
          disabled={loading || !email || !name || password.length < 8}
          sx={{ alignSelf: 'flex-start' }}
        >
          Создать админа
        </Button>
      </Stack>
    </Paper>
  );
}

function ListShell({
  children,
  search,
  setSearch,
  error,
  loading,
  hasMore,
  onMore,
  extraFilters,
}: {
  children: ReactNode;
  search: string;
  setSearch: (value: string) => void;
  error: string;
  loading: boolean;
  hasMore: boolean;
  onMore: () => void;
  extraFilters?: ReactNode;
}) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Поиск по email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 320 }}
        />
        {extraFilters}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={1}>{children}</Stack>
      {loading && <CircularProgress />}
      {hasMore && (
        <Button variant="outlined" onClick={onMore} disabled={loading}>
          Загрузить ещё
        </Button>
      )}
    </Stack>
  );
}

function UserRow({
  item,
  onRefresh,
  onBookings,
  onOffices,
  onDanger,
}: {
  item: UserListItem;
  onRefresh: () => void;
  onBookings?: () => void;
  onOffices?: () => void;
  onDanger?: () => void;
}) {
  const isBanned = Boolean(item.bannedAt);

  const toggleBlock = async () => {
    if (isBanned) {
      if (item.role === 'ADMIN') {
        await unblockAdminWithOffices(item.id);
      } else {
        await unblockUser(item.id);
      }
    } else if (item.role === 'ADMIN' && onDanger) {
      onDanger();
      return;
    } else {
      await blockUser(item.id, 'Заблокировано супер-админом');
    }
    onRefresh();
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 1 }}>
      <Stack direction="row" justifyContent="space-between" gap={2}>
        <Box>
          <Typography fontWeight={700}>{item.email}</Typography>
          <Typography color="text.secondary">
            {item.name} · {item.role}
          </Typography>
          {isBanned && (
            <Typography variant="body2" color="error">
              Заблокирован: {item.bannedReason ?? 'без причины'}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {onBookings && <Button onClick={onBookings}>Аренды</Button>}
          {onOffices && <Button onClick={onOffices}>Офисы</Button>}
          {item.role !== 'SUPER_ADMIN' && (
            <Button
              variant="outlined"
              color={isBanned ? 'success' : 'error'}
              startIcon={isBanned ? <RestoreIcon /> : <BlockIcon />}
              onClick={() => void toggleBlock()}
            >
              {isBanned ? 'Разблокировать' : 'Заблокировать'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function BookingsDialog({
  title,
  bookings,
  onClose,
}: {
  title: string;
  bookings: Booking[];
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(title)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Аренды: {title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          {bookings.map((booking) => (
            <Paper key={booking.id} sx={{ p: 2, borderRadius: 1 }}>
              <Typography fontWeight={700}>
                Место #{booking.markerId} · {booking.status}
              </Typography>
              <Typography color="text.secondary">
                {booking.place.officeName ?? 'Офис'} · {booking.place.floorName}
              </Typography>
              <Typography>
                {formatDateTime(booking.startTime)} -{' '}
                {formatDateTime(booking.endTime)}
              </Typography>
            </Paper>
          ))}
          {bookings.length === 0 && (
            <Typography color="text.secondary">Аренд пока нет.</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

function ReportsDialog({
  title,
  bookings,
  onClose,
}: {
  title: string;
  bookings: Booking[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ReportTab>('places');
  const report = buildOfficeReport(bookings);

  return (
    <Dialog open={Boolean(title)} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Отчёты: {title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Paper sx={{ p: 2, borderRadius: 1, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Отчёт по офису
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Вкладки показывают три варианта отчёта: по местам на этажах, по
              этажам и общий итог по офису.
            </Typography>
          </Paper>

          <Paper sx={{ borderRadius: 1 }}>
            <Tabs value={tab} onChange={(_, value: ReportTab) => setTab(value)}>
              <Tab value="places" label="Места" />
              <Tab value="floors" label="По этажам" />
              <Tab value="office" label="Общий по офису" />
            </Tabs>
          </Paper>

          {tab === 'places' && (
            <Stack spacing={1}>
              {report.placeRows.length === 0 && (
                <Typography color="text.secondary">
                  Нет данных по арендам.
                </Typography>
              )}
              {report.placeRows.map((item) => (
                <Paper
                  key={`${item.floor}-${item.label}`}
                  sx={{ p: 2, borderRadius: 1 }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    gap={2}
                    flexWrap="wrap"
                  >
                    <Box>
                      <Typography fontWeight={700}>{item.label}</Typography>
                      <Typography color="text.secondary">
                        {item.floor}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        label={`Бронирований: ${item.count}`}
                        color="primary"
                      />
                      <Chip
                        label={`Выручка: ${formatCurrency(item.revenue)}`}
                        color="success"
                      />
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {tab === 'floors' && (
            <Stack spacing={1}>
              {report.floorRows.length === 0 && (
                <Typography color="text.secondary">
                  Нет данных по этажам.
                </Typography>
              )}
              {report.floorRows.map((item) => (
                <Paper key={item.floor} sx={{ p: 2, borderRadius: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    gap={2}
                    flexWrap="wrap"
                  >
                    <Box>
                      <Typography fontWeight={700}>{item.floor}</Typography>
                      <Typography color="text.secondary">
                        Уникальных мест: {item.markers.size}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        label={`Бронирований: ${item.count}`}
                        color="primary"
                      />
                      <Chip
                        label={`Выручка: ${formatCurrency(item.revenue)}`}
                        color="success"
                      />
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {tab === 'office' && (
            <Stack spacing={1.5}>
              <Paper sx={{ p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Общий итог по офису
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`Бронирований: ${report.totalBookings}`}
                    color="primary"
                  />
                  <Chip
                    label={`Уникальных мест: ${report.uniquePlaces}`}
                    color="info"
                  />
                  <Chip
                    label={`Этажей: ${report.uniqueFloors}`}
                    color="secondary"
                  />
                  <Chip
                    label={`Выручка: ${formatCurrency(report.totalRevenue)}`}
                    color="success"
                  />
                  <Chip
                    label={`Часов аренды: ${report.totalHours.toFixed(1)}`}
                    color="warning"
                  />
                </Stack>
              </Paper>
              <Typography color="text.secondary" variant="body2">
                Это краткий общий отчёт по арендам для текущего офиса. Данные
                формируются из уже существующих броней и доступны только в
                админском кабинете.
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

function OfficesDialog({
  offices,
  onClose,
}: {
  offices: AdminOffice[];
  onClose: () => void;
}) {
  return (
    <Dialog open={offices.length > 0} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Офисы админа</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          {offices.map((office) => (
            <Paper key={office.id} sx={{ p: 2, borderRadius: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={700}>
                    {office.name ?? `Офис #${office.id}`}
                  </Typography>
                  <Typography color="text.secondary">
                    {office.address ?? 'Адрес не указан'}
                  </Typography>
                </Box>
                <Chip
                  color={office.deletedAt ? 'warning' : 'success'}
                  label={office.deletedAt ? 'Скрыт' : 'Активен'}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmBlockDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: UserListItem | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('Нарушение правил сервиса');

  return (
    <Dialog open={Boolean(user)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Удалить все офисы и заблокировать</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="warning">
            Офисы админа будут скрыты через soft-delete. Их можно восстановить
            при разблокировке.
          </Alert>
          <Typography>{user?.email}</Typography>
          <TextField
            label="Причина"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={3}
          />
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Это действие не удаляет данные физически.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => void onConfirm(reason)}
        >
          Заблокировать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
