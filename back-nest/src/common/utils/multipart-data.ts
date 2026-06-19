export type MultipartFiles = {
  photo?: Express.Multer.File[];
  data?: Express.Multer.File[];
};

export function resolveMultipartDataField(
  rawData: unknown,
  files?: MultipartFiles,
): unknown {
  if (rawData != null) {
    return rawData;
  }

  const dataFile = files?.data?.[0];
  if (!dataFile) {
    return rawData;
  }

  return dataFile.buffer.toString('utf8');
}
