import { Button } from "@mui/material";
import type { ChangeEvent } from "react";

type ImportImageElProps = {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

export default function ImportImageEl({
  onChange,
  disabled = false,
}: ImportImageElProps) {
  return (
    <Button variant="contained" component="label" disabled={disabled}>
      {disabled ? "Сначала создайте этаж" : "Загрузить изображение"}
      <input
        hidden
        disabled={disabled}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={onChange}
      />
    </Button>
  );
}
