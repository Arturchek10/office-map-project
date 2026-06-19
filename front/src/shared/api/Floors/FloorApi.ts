// import axios from "axios";
// import {
//   CreateFloor,
//   ResponseCreateFloor,
//   PatchFloor,
// } from "../../types/floor";

// const BASE_URL = "http://10.10.146.211:8080";

// // получение этажа по startFloorId из объекта офиса
// export const getFloor = async (
//   floorId: number
// ): Promise<ResponseCreateFloor> => {
//   const res = await axios.get(`${BASE_URL}/api/v1/floors/${floorId}`);
//   return res.data;
// };

// type createFloorParams = {
//   officeId: number;
//   newFloor: CreateFloor;
// };

// // создание нового этажа
// // officeId - ID офиса, в котором создается этаж
// export const createFloor = async ({
//   officeId,
//   newFloor,
// }: createFloorParams): Promise<ResponseCreateFloor> => {
//   try {
//     const res = await axios.post(
//       `${BASE_URL}/api/v1/floors/${officeId}`,
//       newFloor
//     );
//     return res.data;
//   } catch (error) {
//     console.error("Ошибка при создании этажа:", error);
//     throw new Error("Не удалось создать этаж. Пожалуйста, попробуйте позже.");
//   }
// };

// type PatchFloorParams = { floorId: number; newFloor: PatchFloor };
// // Обновление существующего этажа. Передаем photo (file) или removePhoto (boolean).
// // newFloor - объект с новыми данными этажа, может содержать photo (file) или removePhoto (boolean).
// // floorId - ID этажа, который нужно обновить
// export const patchFloor = async ({
//   floorId,
//   newFloor,
// }: PatchFloorParams): Promise<ResponseCreateFloor> => {
//   if (newFloor.photo && newFloor.removePhoto) {
//     throw new Error("Нельзя одновременно передавать photo и removePhoto=true");
//   }

//   const formData = new FormData();

//   if (newFloor.photo) {
//     formData.append("photo", newFloor.photo);
//   } else if (newFloor.removePhoto) {
//     formData.append("removePhoto", "true");
//   }

//   const res = await axios.patch<ResponseCreateFloor>(
//     `${BASE_URL}/api/v1/floors/plan/${floorId}`,
//     formData,
//     {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     }
//   );

//   return res.data;
// };
