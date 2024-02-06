import { IRole } from "./IRole";

/**
 * An interface that defines user context of the access control module.
 *  @interface
 */
interface IUser {
  /**
   *  Indicates the id of a user.
   *  @type {String}
   */
  id: string;

  /**
   *  Indicates a single or multiple roles assigned to the current user.
   *  @type {Array<IRole>}
   */
  roles: IRole[];
}

function isIUser(obj: any): obj is IUser {
  return !!obj && typeof obj.id === "string";
}

export { IUser, isIUser };
