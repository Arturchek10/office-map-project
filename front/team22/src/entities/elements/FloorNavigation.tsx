import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { ButtonGroup, Button, Tooltip } from "@mui/material";
import Box from "@mui/material/Box";
import { TOfficeFloor} from  "@shared/api/Offices/GetOfficeById";

type FloorNavigationProps = {
  floors: TOfficeFloor[];
  currentFloor: TOfficeFloor | null;
  onChange: (floor: TOfficeFloor) => void;
};

export default function FloorNavigation({
  floors,
  currentFloor,
  onChange,
}: FloorNavigationProps) {
  
  // логи FloorNavigation
  // console.log("FloorNavigation component render");
  // console.log("currentFloor", currentFloor?.id);

  // сортируем, чтобы кнопки всегда шли от нижнего к верхнему
  const sortedFloors = [...floors].sort((a, b) =>  b.orderNumber - a.orderNumber);

  if (currentFloor === null) return null;
  const currentIndex = sortedFloors.findIndex(
    (f) => f.id === currentFloor.id
  );

  const handleDown = () => {
    if (currentIndex < sortedFloors.length - 1) {
      onChange(sortedFloors[currentIndex + 1]);
    }
  };

  const handleUp = () => {
    if (currentIndex > 0) {
      onChange(sortedFloors[currentIndex - 1]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Tooltip title="наверх" placement="right">
        <span>
          <Button
            onClick={handleUp}
            disabled={currentIndex === 0}
          >
            <ArrowUpwardIcon />
          </Button>
        </span>
      </Tooltip>

      <Box sx={{ display: "flex", "& > *": { m: 1 } }}>
        <ButtonGroup
          orientation="vertical"
          aria-label="Vertical button group"
          variant="contained"
        >
          {sortedFloors.map((f) => (
            <Tooltip key={f.id} title={`${f.name}`} placement="right">
              <Button
                onClick={() => onChange(f)}
                color={f.id === currentFloor.id ? "secondary" : "primary"}
              >
                {f.orderNumber}
              </Button>
            </Tooltip>
          ))}
        </ButtonGroup>
      </Box>

      <Tooltip title="вниз" placement="right">
        <span>
          <Button onClick={handleDown} disabled={currentIndex === sortedFloors.length - 1}>
            <ArrowDownwardIcon />
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
