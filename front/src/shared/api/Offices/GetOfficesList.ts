import { createStore, createEffect } from "effector";
import { TOffice } from "@entities/Office/type/office";
import { addOfficeFx } from "./AddOffice";
import { deleteOfficeFx } from "./DeleteOffice";
import { apiGet } from "@shared/utils/api";

export const fetchOfficesFx = createEffect<void, TOffice[], Error>(async () => {
  // мок
  const USE_MOCK = false;
  if (USE_MOCK) {
    return [
      {
        id: 1,
        name: "Headquarters",
        latitude: 52.3676,
        longitude: 4.9041,
        photoUrl: "https://picsum.photos/400/300?random=1",
        city: "Amsterdam",
        address: "Herengracht 123",
      },
      {
        id: 2,
        name: "Tech Hub",
        latitude: 52.52,
        longitude: 13.405,
        photoUrl: "https://picsum.photos/400/300?random=2",
        city: "Berlin",
        address: "Alexanderplatz 5",
      },
      {
        id: 3,
        name: "Business Center",
        latitude: 48.8566,
        longitude: 2.3522,
        photoUrl: "https://picsum.photos/400/300?random=3",
        city: "Paris",
        address: "Rue de Rivoli 10",
      },
      {
        id: 4,
        name: "Innovation Lab",
        latitude: 51.5074,
        longitude: -0.1278,
        photoUrl: "https://picsum.photos/400/300?random=4",
        city: "London",
        address: "Baker Street 221B",
      },
    ] as TOffice[];
  }

  const res = await apiGet("/api/v1/offices");

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let errorMessage = `Ошибка ${res.status}`;

    if (contentType.includes("application/json")) {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } else {
      const textData = await res.text();
      if (textData) errorMessage = textData;
    }

    throw new Error(errorMessage);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Ответ сервера не в формате JSON");
  }

  return await res.json();
});

export const $offices = createStore<TOffice[]>([])
  .on(fetchOfficesFx.doneData, (_, offices) => offices)
  .on(addOfficeFx.doneData, (state, newOffice) => [...state, newOffice])
  .on(deleteOfficeFx.doneData, (state, deletedOfficeId) =>
    state.filter((office) => office.id !== deletedOfficeId),
  );

export const $officesLoading = fetchOfficesFx.pending;
export const $officesError = createStore<Error | null>(null)
  .on(fetchOfficesFx.failData, (_, e) => e)
  .on(fetchOfficesFx.done, () => null)
  .on(deleteOfficeFx.failData, (_, e) => e)
  .on(deleteOfficeFx.done, () => null);

// При клике на Оффис мы должны переходить на новый сайт и запрашивать
// api/v1/offices/{id}
// Если этажей нету то рисуем
