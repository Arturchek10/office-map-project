import { Button } from "@mui/material";

type ImportImageElProps = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ImportImageEl({ onChange }: ImportImageElProps) {
  return (
    <>
      <label className="cursor-pointer">
        <Button variant="contained" component="span">
          Загрузить изображение
        </Button>
        <input type="file" onChange={onChange} className="hidden"></input>
      </label>
    </>
  );
}
