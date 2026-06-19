export type CurrentOffice = {
  id: number;
  name: string;
  createdByUserId?: number | string | null;
  startFloor: {
    id: number;
    name: string;
    orderNumber: number;
  },
  floors: {
    id: number;
    name: string;
    orderNumber: number;
  }[]
}
