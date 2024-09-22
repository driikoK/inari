export const isObjEmpty = (obj: Object = {}) => Object.keys(obj).length === 0;

export const isObjValuesExist = (obj: Object = {}) => {
  return Object.values(obj).some((value) => value);
};
