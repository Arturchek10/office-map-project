import { createStore, createEvent, sample } from "effector";
import { addOfficeFx } from "@shared/api/Offices/AddOffice";

export const $officeError = createStore<string | null>(null)

// записываем ошибку

sample({
  clock: addOfficeFx.failData,
  fn: (error) => error.message,
  target: $officeError
})

// очищаем при новом запросе

sample({
  clock: addOfficeFx,
  fn: () => null,
  target: $officeError
})