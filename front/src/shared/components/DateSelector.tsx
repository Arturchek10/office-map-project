import { useEffect, useState } from "react";

type DateOption = {
  id: string; // фул дата
  label: string; // пн, вт
  date: string; // 18, 19
  fullDate: string; // 2026.05.18
  isToday?: boolean; // сегодня или нет
  isTomorrow?: boolean; // завтра или нет
};

type SelectedDateProps = {
  selectedDate: string;
  onSelect: (date: string) => void;
};

export default function DateSelector({
  selectedDate,
  onSelect,
}: SelectedDateProps) {
  const [dates, setDates] = useState<DateOption[]>([]);

  useEffect(() => {
    const generateDates = () => {
      const options: DateOption[] = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

        const option: DateOption = {
          id: date.toISOString().split("T")[0],
          label: dayNames[date.getDay()],
          date: date.getDate().toString().padStart(2, "0"),
          fullDate: date.toISOString().split("T")[0],
          isToday: i === 0,
          isTomorrow: i === 1,
        };
        options.push(option);
      }
      setDates(options);
    };
    generateDates();
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide justify-center">
      {dates.map((d) => {
        const isSelected = selectedDate === d.fullDate;

        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.fullDate)}
            className={`
              flex flex-col items-center justify-center 
              min-w-[68px] h-20 rounded-3xl border-2 transition-all
              ${
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                  : "bg-white border-gray-200 hover:border-blue-300 active:scale-95"
              }
            `}
          >
            <span
              className={`text-sm font-medium ${isSelected ? "text-blue-100" : "text-gray-500"}`}
            >
              {d.label}
            </span>
            <span className="text-2xl font-semibold mt-1">{d.date}</span>

            <span className="text-[10px] flex h-4 opacity-75 items-center justify-center">
              {d.isToday && "Сегодня"}
              {d.isTomorrow && "Завтра"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
