enum UserRoleEnum {
  CANVASSER = 0,
  REVIEWER = 1,
  MANAGER = 2,
  OWNER = 3,
}

export const getUserRoleEnumLabel = (userRoleEnum: UserRoleEnum) => {
  switch (userRoleEnum) {
    case UserRoleEnum.CANVASSER:
      return "Canvasser";
    case UserRoleEnum.REVIEWER:
      return "Reviewer";
    case UserRoleEnum.MANAGER:
      return "Manager";
    case UserRoleEnum.OWNER:
      return "Owner";
    default:
      return "Unknown";
  }
};

export const getUserRoleEnums = () => {
  const enums = Object.entries(UserRoleEnum);
  const result = [];

  for (const [key, value] of enums) {
    if (typeof value === "number") {
      result.push({
        id: value,
        name: getUserRoleEnumLabel(+value),
      });
    }
  }
  return result;
};
export const MANAGER_ROLES = [UserRoleEnum.MANAGER, UserRoleEnum.OWNER];
export default UserRoleEnum;
