import type { Interval } from "../../entities/BookingMarkerForm/BookingMarkerForm";


type TimeIntervalButtonProps = {
  intervals: Interval[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export default function TimeIntervalButton({
  intervals,
  selectedId,
  onSelect,
}: TimeIntervalButtonProps) {

  return (
    <div className="flex flex-wrap justify-center gap-3 w-full">
      {intervals.map((interval) => {
        const isSelected = selectedId === interval.id;

        return (
          <button
            key={interval.id}
            onClick={() => onSelect(interval.id)}
            className={`
              flex flex-col items-center justify-center 
              w-31 h-22 py-4
              rounded-3xl border-2 transition-all duration-200
              ${
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-105"
                  : "bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 active:scale-95"
              }
            `}
          >
            <span className="font-semibold text-base mb-1">
              {interval.label}
            </span>
            <span
              className={`text-sm ${isSelected ? "text-blue-100" : "text-blue-700"}`}
            >
              {interval.time}
            </span>
          </button>
        );
      })}

      {/* Кнопка Custom во всю ширину */}
      {selectedId !== "custom" && (<button
        onClick={() => onSelect("custom")}
        className={`
          w-full py-4 px-6 
          rounded-3xl border-2 transition-all duration-200 text-lg font-semibold
          ${
            selectedId === "custom"
              ? "bg-blue-600 border-blue-600 text-white shadow-lg"
              : "bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700"
          }
        `}
      >
        Другой интервал (custom)
      </button>)}
     
    </div>
  );
}
