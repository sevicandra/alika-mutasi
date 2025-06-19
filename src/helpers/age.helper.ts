export const Invant = (birthDate: Date, referenceDate: Date) => {
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);

  let ageInYears = ref.getFullYear() - birth.getFullYear();

  if (
    ref.getMonth() < birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() < birth.getDate())
  ) {
    ageInYears--;
  }

  return ageInYears < 2;
};


export const Adult = (birthDate: Date, referenceDate: Date) => {
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);

  let ageInYears = ref.getFullYear() - birth.getFullYear();

  if (
    ref.getMonth() < birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() < birth.getDate())
  ) {
    ageInYears--;
  }

  return ageInYears >= 21;
}